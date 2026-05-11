import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import './AddNoticeEvent.css';
import SidePanel from './SidePanel';
import { getItems, addItem, getAuthToken } from '../data/storageService';
import { isAdmin } from '../utils/roleUtils';

const API_BASE = 'http://localhost:5000';

// ─── Email Notification Sub-component ─────────────────────────────────────────
// Uses forwardRef + useImperativeHandle so the parent can call sendNotification
// and getEmailState directly via a ref — avoids the broken DOM bridge pattern.
const EmailNotificationSection = forwardRef(({ formData, enabled, onToggle }, ref) => {
  const [emailState, setEmailState] = useState({
    mode: 'manual',          // 'manual' | 'auto'
    manualTo: '',
    subject: '',
    body: '',
    sending: false,
    result: null,            // { success, message }
    errors: {}
  });

  // Auto-populate subject & body from form when toggled on
  const handleToggle = () => {
    if (!enabled) {
      const sectionLabel = formData.section === 'notice' ? 'Notice' : 'Event';
      const yearList = formData.years.join(', ') || 'All students';
      setEmailState(prev => ({
        ...prev,
        subject: formData.title
          ? `[${sectionLabel}] ${formData.title}`
          : `New ${sectionLabel} Posted`,
        body: formData.title
          ? `Dear Student,\n\nA new ${sectionLabel.toLowerCase()} "${formData.title}" has been posted for: ${yearList}.\n\nPlease check the notice board for details.\n\nRegards,\nAdmin`
          : `Dear Student,\n\nA new ${sectionLabel.toLowerCase()} has been posted for: ${yearList}.\n\nPlease check the notice board for details.\n\nRegards,\nAdmin`,
        result: null
      }));
    }
    onToggle();
  };

  const update = (field, value) =>
    setEmailState(prev => ({ ...prev, [field]: value, errors: { ...prev.errors, [field]: '' } }));

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailState.mode === 'manual') {
      const emails = emailState.manualTo.split(',').map(e => e.trim()).filter(Boolean);
      if (emails.length === 0) errs.manualTo = 'Enter at least one recipient email';
      else {
        const bad = emails.filter(e => !emailRegex.test(e));
        if (bad.length) errs.manualTo = `Invalid email(s): ${bad.join(', ')}`;
      }
    }
    if (!emailState.subject.trim()) errs.subject = 'Subject is required';
    if (!emailState.body.trim()) errs.body = 'Message body is required';
    setEmailState(prev => ({ ...prev, errors: errs }));
    return Object.keys(errs).length === 0;
  };

  // Called externally (from handleSubmit) after notice is saved
  const sendNotification = async (recipientEmails) => {
    if (!validate()) return false;

    setEmailState(prev => ({ ...prev, sending: true, result: null }));

    let toList;
    if (emailState.mode === 'auto') {
      toList = recipientEmails || [];
    } else {
      toList = emailState.manualTo.split(',').map(e => e.trim()).filter(Boolean);
    }

    if (toList.length === 0) {
      setEmailState(prev => ({
        ...prev,
        sending: false,
        result: { success: false, message: 'No recipients found for the selected year(s).' }
      }));
      return false;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/notices/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: toList,
          subject: emailState.subject,
          body: emailState.body
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEmailState(prev => ({
          ...prev,
          sending: false,
          result: {
            success: true,
            message: `✓ ${data.message}${data.previewUrl ? ` | Preview: ${data.previewUrl}` : ''}`
          }
        }));
        return true;
      } else {
        setEmailState(prev => ({
          ...prev,
          sending: false,
          result: { success: false, message: data.error || 'Failed to send email.' }
        }));
        return false;
      }
    } catch (err) {
      setEmailState(prev => ({
        ...prev,
        sending: false,
        result: { success: false, message: `Network error: ${err.message}` }
      }));
      return false;
    }
  };

  // Expose sendNotification on the DOM node so parent can call it
  // We use a callback-ref pattern via a hidden <span>

  useImperativeHandle(ref, () => ({
    sendNotification,
    validateEmail: validate,
    getEmailState: () => emailState,
  }));

  return (
    <div className="email-notification-wrapper">
      {/* Toggle Row */}
      <div className="email-toggle-row">
        <label className="email-toggle-label" htmlFor="emailToggle">
          <span className="email-icon">✉</span>
          Send Email Notification
        </label>
        <div
          id="emailToggle"
          className={`toggle-switch ${enabled ? 'on' : ''}`}
          onClick={handleToggle}
          role="switch"
          aria-checked={enabled}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleToggle()}
        >
          <span className="toggle-thumb" />
        </div>
      </div>

      {/* Expandable Panel */}
      {enabled && (
        <div className="email-panel">
          {/* Recipient Mode */}
          <div className="email-field">
            <label className="email-field-label">Recipients</label>
            <div className="recipient-mode-tabs">
              <button
                type="button"
                className={`mode-tab ${emailState.mode === 'auto' ? 'active' : ''}`}
                onClick={() => update('mode', 'auto')}
              >
                Auto (by year)
              </button>
              <button
                type="button"
                className={`mode-tab ${emailState.mode === 'manual' ? 'active' : ''}`}
                onClick={() => update('mode', 'manual')}
              >
                Manual
              </button>
            </div>

            {emailState.mode === 'auto' ? (
              <p className="auto-mode-hint">
                Emails will be sent automatically to all <strong>{formData.years.join(', ') || 'selected year'}</strong> students registered in the system.
              </p>
            ) : (
              <>
                <input
                  type="text"
                  className={`form-input ${emailState.errors.manualTo ? 'error' : ''}`}
                  placeholder="email1@example.com, email2@example.com"
                  value={emailState.manualTo}
                  onChange={e => update('manualTo', e.target.value)}
                />
                {emailState.errors.manualTo && (
                  <span className="error-text">{emailState.errors.manualTo}</span>
                )}
                <span className="email-hint">Separate multiple addresses with commas</span>
              </>
            )}
          </div>

          {/* Subject */}
          <div className="email-field">
            <label className="email-field-label">
              Subject <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-input ${emailState.errors.subject ? 'error' : ''}`}
              value={emailState.subject}
              onChange={e => update('subject', e.target.value)}
              placeholder="Email subject line"
            />
            {emailState.errors.subject && (
              <span className="error-text">{emailState.errors.subject}</span>
            )}
          </div>

          {/* Body */}
          <div className="email-field">
            <label className="email-field-label">
              Message Body <span className="required">*</span>
            </label>
            <textarea
              className={`form-textarea ${emailState.errors.body ? 'error' : ''}`}
              value={emailState.body}
              onChange={e => update('body', e.target.value)}
              rows={6}
              placeholder="Email message content..."
            />
            {emailState.errors.body && (
              <span className="error-text">{emailState.errors.body}</span>
            )}
          </div>

          {/* Status */}
          {emailState.sending && (
            <div className="email-status sending">
              <span className="spinner" /> Sending email notification…
            </div>
          )}
          {emailState.result && !emailState.sending && (
            <div className={`email-status ${emailState.result.success ? 'success' : 'failure'}`}>
              {emailState.result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
EmailNotificationSection.displayName = 'EmailNotificationSection';

// ─── Main Component ────────────────────────────────────────────────────────────
const AddNoticeEvent = ({ user = {}, onNavigateToDashboard, onNavigateToHistory, onLogout, onNavigateToSearch }) => {
  const emailSectionRef = useRef(null); // FIX: proper React ref instead of DOM bridge

  const [formData, setFormData] = useState({
    title: '',
    photo1: null,
    photo1Preview: null,
    visibilityDate1: '',
    visibilityTime1: '',
    visibilityEndDate1: '',
    visibilityEndTime1: '',
    hyperlink1: '',
    photo2: null,
    photo2Preview: null,
    visibilityDate2: '',
    visibilityTime2: '',
    visibilityEndDate2: '',
    visibilityEndTime2: '',
    hyperlink2: '',
    section: 'notice',
    years: []
  });

  const [errors, setErrors] = useState({});
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const parseDateTime = (dateValue, timeValue) => {
    if (!dateValue) return null;
    const value = timeValue ? `${dateValue}T${timeValue}` : dateValue;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const handlePhotoChange = (e, photoField) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [photoField]: file,
          [`${photoField}Preview`]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e, field) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleYearToggle = (year) => {
    setFormData(prev => {
      const updatedYears = prev.years.includes(year)
        ? prev.years.filter(y => y !== year)
        : [...prev.years, year];
      return { ...prev, years: updatedYears };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.photo1 && formData.section === 'notice') newErrors.photo1 = 'Photo is required for notices';
    if (!formData.visibilityDate1) newErrors.visibilityDate1 = 'Visibility start date is required';
    if (!formData.visibilityTime1) newErrors.visibilityTime1 = 'Visibility start time is required';
    if (!formData.visibilityEndDate1) newErrors.visibilityEndDate1 = 'Visibility end date is required';
    if (!formData.visibilityEndTime1) newErrors.visibilityEndTime1 = 'Visibility end time is required';

    const startDateTime1 = parseDateTime(formData.visibilityDate1, formData.visibilityTime1);
    const endDateTime1 = parseDateTime(formData.visibilityEndDate1, formData.visibilityEndTime1);
    if (startDateTime1 && endDateTime1 && endDateTime1 <= startDateTime1) {
      newErrors.visibilityEndDate1 = 'End date/time must be after start date/time';
    }

    const photo2Provided = formData.photo2 || formData.visibilityDate2 || formData.visibilityTime2 || formData.visibilityEndDate2 || formData.visibilityEndTime2 || formData.hyperlink2;
    if (photo2Provided) {
      if (!formData.visibilityDate2) newErrors.visibilityDate2 = 'Secondary visibility start date is required';
      if (!formData.visibilityTime2) newErrors.visibilityTime2 = 'Secondary visibility start time is required';
      if (!formData.visibilityEndDate2) newErrors.visibilityEndDate2 = 'Secondary visibility end date is required';
      if (!formData.visibilityEndTime2) newErrors.visibilityEndTime2 = 'Secondary visibility end time is required';

      const startDateTime2 = parseDateTime(formData.visibilityDate2, formData.visibilityTime2);
      const endDateTime2 = parseDateTime(formData.visibilityEndDate2, formData.visibilityEndTime2);
      if (startDateTime2 && endDateTime2 && endDateTime2 <= startDateTime2) {
        newErrors.visibilityEndDate2 = 'Secondary end date/time must be after start date/time';
      }
      if (startDateTime1 && endDateTime1 && startDateTime2 && startDateTime2 < endDateTime1) {
        newErrors.visibilityDate2 = 'Secondary image must start after the first image ends';
      }
    }

    if (!formData.hyperlink1) newErrors.hyperlink1 = 'Hyperlink is required';
    if (!formData.section) newErrors.section = 'Section is required';
    if (formData.years.length === 0) newErrors.years = 'Please select at least one year level';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const token = getAuthToken();
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('section', formData.section);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('visibilityDate', formData.visibilityDate1);
      if (formData.visibilityTime1) formDataToSend.append('visibilityTime', formData.visibilityTime1);
      formDataToSend.append('visibilityEndDate', formData.visibilityEndDate1);
      if (formData.visibilityEndTime1) formDataToSend.append('visibilityEndTime', formData.visibilityEndTime1);
      formDataToSend.append('hyperlink', formData.hyperlink1);
      formDataToSend.append('years', JSON.stringify(formData.years));
      if (formData.photo1) formDataToSend.append('photo', formData.photo1);
      if (formData.photo2) formDataToSend.append('photo2', formData.photo2);
      if (formData.visibilityDate2) formDataToSend.append('visibilityDate2', formData.visibilityDate2);
      if (formData.visibilityTime2) formDataToSend.append('visibilityTime2', formData.visibilityTime2);
      if (formData.visibilityEndDate2) formDataToSend.append('visibilityEndDate2', formData.visibilityEndDate2);
      if (formData.visibilityEndTime2) formDataToSend.append('visibilityEndTime2', formData.visibilityEndTime2);
      if (formData.hyperlink2) formDataToSend.append('hyperlink2', formData.hyperlink2);

      const response = await fetch(`${API_BASE}/api/notices`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData = {};
        try {
          errorData = contentType?.includes('application/json')
            ? await response.json()
            : { message: await response.text() };
        } catch (_) {}
        alert(`Failed to create ${formData.section}: ${errorData.message || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      addItem(data);

      // ── Send email notification if enabled ──────────────────────────────────
      if (emailEnabled && emailSectionRef.current) {
        const emailApi = emailSectionRef.current;
        const emailState = emailApi.getEmailState();
        let recipientEmails = [];

        // FIX: Auto mode — fetch real users from DB by year
        if (emailState.mode === 'auto' && formData.years.length > 0) {
          try {
            console.log('[AddNoticeEvent] Fetching users for years:', formData.years);
            const yearsParam = encodeURIComponent(formData.years.join(','));
            const usersRes = await fetch(`${API_BASE}/api/users/by-year?years=${yearsParam}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (usersRes.ok) {
              const users = await usersRes.json();
              recipientEmails = users.map(u => u.email).filter(Boolean);
              console.log(`[AddNoticeEvent] Auto mode: found ${recipientEmails.length} recipients`);
            } else {
              console.error('[AddNoticeEvent] Failed to fetch users for auto mode');
            }
          } catch (fetchErr) {
            console.error('[AddNoticeEvent] Error fetching auto-mode recipients:', fetchErr.message);
          }
        }

        await emailApi.sendNotification(recipientEmails);
      }

      alert(`${formData.section === 'notice' ? 'Notice' : 'Event'} added successfully!${emailEnabled ? '\nEmail notification sent.' : ''}`);
      onNavigateToDashboard();
    } catch (error) {
      console.error('Error saving item:', error);
      alert(`Failed to save item: ${error.message}`);
    }
  };

  // Authorization check
  if (!isAdmin(user)) {
    return (
      <div className="add-notice-container">
        <div className="add-notice-card">
          <div className="add-notice-header">
            <button className="back-btn" onClick={onNavigateToDashboard}>⟵</button>
            <h1 className="web-title">web title</h1>
            <button className="profile-icon" onClick={() => setIsPanelOpen(true)}>👤</button>
          </div>
          <div className="add-notice-content auth-error">
            <div className="error-container">
              <h2>Access Denied</h2>
              <p>Admin authentication required.</p>
              <button onClick={onNavigateToDashboard} className="submit-btn">Back to Dashboard</button>
            </div>
          </div>
          <div className="bottom-nav">
            <button className="nav-icon" onClick={onNavigateToDashboard}>🏠</button>
            <button className="nav-icon" onClick={onNavigateToSearch}>🔍</button>
            <button className="nav-icon" onClick={onNavigateToHistory}>🕐</button>
            <button className="nav-icon active">➕</button>
          </div>
          <div className="home-indicator"></div>
          <SidePanel open={isPanelOpen} onClose={() => setIsPanelOpen(false)} user={user} onLogout={onLogout} />
        </div>
      </div>
    );
  }

  return (
    <div className="add-notice-container">
      <div className="add-notice-card">
        {/* Header */}
        <div className="add-notice-header">
          <button className="back-btn" onClick={() => window.history.back()}>⟵</button>
          <h1 className="web-title">web title</h1>
          <button className="profile-icon" onClick={() => setIsPanelOpen(true)}>👤</button>
        </div>

        {/* Form Content */}
        <div className="add-notice-content">
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-section">
              <label htmlFor="noticeTitle" className="field-label">
                {formData.section === 'notice' ? 'Notice' : 'Event'} Name
                <span className="required">*</span>
              </label>
              <input
                type="text"
                id="noticeTitle"
                placeholder={`Enter ${formData.section === 'notice' ? 'notice' : 'event'} name`}
                value={formData.title}
                onChange={(e) => handleInputChange(e, 'title')}
                className={`form-input ${errors.title ? 'error' : ''}`}
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            {/* Photo 1 */}
            <div className="form-section">
              <label className="section-label">
                add a photo {formData.section === 'event' && '(optional)'}
                {formData.section === 'notice' && <span className="required">*</span>}
              </label>
              <div className="photo-input-wrapper">
                <input type="file" id="photo1" accept="image/*" onChange={(e) => handlePhotoChange(e, 'photo1')} className="photo-input" />
                <label htmlFor="photo1" className="photo-label">
                  {formData.photo1Preview
                    ? <img src={formData.photo1Preview} alt="Preview" className="photo-preview" />
                    : <div className="photo-placeholder">Click to add photo</div>}
                </label>
              </div>
              {errors.photo1 && <span className="error-text">{errors.photo1}</span>}
            </div>

            {/* Visibility Date 1 */}
            <div className="form-section">
              <label htmlFor="visibilityDate1" className="field-label">visibility start date<span className="required">*</span></label>
              <input type="date" id="visibilityDate1" value={formData.visibilityDate1} onChange={(e) => handleInputChange(e, 'visibilityDate1')} className={`form-input ${errors.visibilityDate1 ? 'error' : ''}`} />
              <input type="time" id="visibilityTime1" value={formData.visibilityTime1} onChange={(e) => handleInputChange(e, 'visibilityTime1')} className={`form-input time-input ${errors.visibilityTime1 ? 'error' : ''}`} style={{ marginTop: 8 }} />
              {errors.visibilityDate1 && <span className="error-text">{errors.visibilityDate1}</span>}
              {errors.visibilityTime1 && <span className="error-text">{errors.visibilityTime1}</span>}
            </div>

            {/* Visibility End Date 1 */}
            <div className="form-section">
              <label htmlFor="visibilityEndDate1" className="field-label">visibility end date<span className="required">*</span></label>
              <input type="date" id="visibilityEndDate1" value={formData.visibilityEndDate1} onChange={(e) => handleInputChange(e, 'visibilityEndDate1')} className={`form-input ${errors.visibilityEndDate1 ? 'error' : ''}`} />
              <input type="time" id="visibilityEndTime1" value={formData.visibilityEndTime1} onChange={(e) => handleInputChange(e, 'visibilityEndTime1')} className={`form-input time-input ${errors.visibilityEndTime1 ? 'error' : ''}`} style={{ marginTop: 8 }} />
              {errors.visibilityEndDate1 && <span className="error-text">{errors.visibilityEndDate1}</span>}
              {errors.visibilityEndTime1 && <span className="error-text">{errors.visibilityEndTime1}</span>}
            </div>

            {/* Hyperlink 1 */}
            <div className="form-section">
              <label htmlFor="hyperlink1" className="field-label">hyperlink<span className="required">*</span></label>
              <input type="url" id="hyperlink1" placeholder="https://example.com" value={formData.hyperlink1} onChange={(e) => handleInputChange(e, 'hyperlink1')} className={`form-input ${errors.hyperlink1 ? 'error' : ''}`} />
              {errors.hyperlink1 && <span className="error-text">{errors.hyperlink1}</span>}
            </div>

            {/* Photo 2 */}
            <div className="form-section">
              <label className="section-label">add a photo (optional)</label>
              <div className="photo-input-wrapper">
                <input type="file" id="photo2" accept="image/*" onChange={(e) => handlePhotoChange(e, 'photo2')} className="photo-input" />
                <label htmlFor="photo2" className="photo-label">
                  {formData.photo2Preview
                    ? <img src={formData.photo2Preview} alt="Preview" className="photo-preview" />
                    : <div className="photo-placeholder">Click to add photo</div>}
                </label>
              </div>
            </div>

            {/* Visibility Date 2 */}
            <div className="form-section">
              <label htmlFor="visibilityDate2" className="field-label">visibility start date</label>
              <input type="date" id="visibilityDate2" value={formData.visibilityDate2} onChange={(e) => handleInputChange(e, 'visibilityDate2')} className={`form-input ${errors.visibilityDate2 ? 'error' : ''}`} />
              <input type="time" id="visibilityTime2" value={formData.visibilityTime2} onChange={(e) => handleInputChange(e, 'visibilityTime2')} className={`form-input time-input ${errors.visibilityTime2 ? 'error' : ''}`} style={{ marginTop: 8 }} />
              {errors.visibilityDate2 && <span className="error-text">{errors.visibilityDate2}</span>}
              {errors.visibilityTime2 && <span className="error-text">{errors.visibilityTime2}</span>}
            </div>

            {/* Visibility End Date 2 */}
            <div className="form-section">
              <label htmlFor="visibilityEndDate2" className="field-label">visibility end date</label>
              <input type="date" id="visibilityEndDate2" value={formData.visibilityEndDate2} onChange={(e) => handleInputChange(e, 'visibilityEndDate2')} className="form-input" />
              <input type="time" id="visibilityEndTime2" value={formData.visibilityEndTime2} onChange={(e) => handleInputChange(e, 'visibilityEndTime2')} className={`form-input time-input ${errors.visibilityEndTime2 ? 'error' : ''}`} style={{ marginTop: 8 }} />
              {errors.visibilityEndDate2 && <span className="error-text">{errors.visibilityEndDate2}</span>}
              {errors.visibilityEndTime2 && <span className="error-text">{errors.visibilityEndTime2}</span>}
            </div>

            {/* Hyperlink 2 */}
            <div className="form-section">
              <label htmlFor="hyperlink2" className="field-label">hyperlink</label>
              <input type="url" id="hyperlink2" placeholder="https://example.com" value={formData.hyperlink2} onChange={(e) => handleInputChange(e, 'hyperlink2')} className="form-input" />
            </div>

            {/* Section */}
            <div className="form-section">
              <label htmlFor="section" className="field-label">Section<span className="required">*</span></label>
              <select id="section" value={formData.section} onChange={(e) => handleInputChange(e, 'section')} className={`form-select ${errors.section ? 'error' : ''}`}>
                <option value="notice">Notice</option>
                <option value="event">Event</option>
              </select>
              {errors.section && <span className="error-text">{errors.section}</span>}
            </div>

            {/* Year Level */}
            <div className="form-section">
              <label className="field-label">Display for year levels<span className="required">*</span></label>
              <div className={`year-checkbox-group ${errors.years ? 'error' : ''}`}>
                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(year => (
                  <label key={year} className="year-checkbox-label">
                    <input type="checkbox" checked={formData.years.includes(year)} onChange={() => handleYearToggle(year)} className="year-checkbox" />
                    <span className="checkbox-text">{year}</span>
                  </label>
                ))}
              </div>
              {errors.years && <span className="error-text">{errors.years}</span>}
            </div>

            {/* ── Email Notification Section ──────────────────────────────────── */}
            <div className="form-section email-section-wrapper">
              <EmailNotificationSection
                ref={emailSectionRef}
                formData={formData}
                enabled={emailEnabled}
                onToggle={() => setEmailEnabled(prev => !prev)}
              />
            </div>

            {/* Submit */}
            <button type="submit" className="submit-btn">Submit</button>
          </form>
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          <button className="nav-icon" onClick={onNavigateToDashboard}>🏠</button>
          <button className="nav-icon" onClick={onNavigateToSearch}>🔍</button>
          <button className="nav-icon" onClick={onNavigateToHistory}>🕐</button>
          <button className="nav-icon active">➕</button>
        </div>

        <div className="home-indicator"></div>
        <SidePanel open={isPanelOpen} onClose={() => setIsPanelOpen(false)} user={user} onLogout={onLogout} />
      </div>
    </div>
  );
};

export default AddNoticeEvent;
