import React, { useState, useEffect } from 'react';
import './AddNoticeEvent.css';
import SidePanel from './SidePanel';

const AddNoticeEvent = ({ user = {}, onNavigateToDashboard, onNavigateToHistory, onLogout, onNavigateToSearch }) => {
  const [formData, setFormData] = useState({
    title: '',
    photo1: null,
    photo1Preview: null,
    visibilityDate1: '',
    hyperlink1: '',
    photo2: null,
    photo2Preview: null,
    visibilityDate2: '',
    hyperlink2: '',
    section: 'notice',
    years: []
  });

  const [errors, setErrors] = useState({});
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // (Removed localStorage hydration because it corrupts File objects)

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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleYearToggle = (year) => {
    setFormData(prev => {
      const updatedYears = prev.years.includes(year)
        ? prev.years.filter(y => y !== year)
        : [...prev.years, year];
      return {
        ...prev,
        years: updatedYears
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.photo1 && formData.section === 'notice') {
      newErrors.photo1 = 'Photo is required for notices';
    }
    if (!formData.visibilityDate1) {
      newErrors.visibilityDate1 = 'Visibility date is required';
    }
    if (!formData.hyperlink1) {
      newErrors.hyperlink1 = 'Hyperlink is required';
    }
    if (!formData.section) {
      newErrors.section = 'Section is required';
    }
    if (formData.years.length === 0) {
      newErrors.years = 'Please select at least one year level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const formDataToSend = new FormData();
        if (formData.photo1) {
          formDataToSend.append('photo', formData.photo1);
        }

        formDataToSend.append('title', formData.title);
        formDataToSend.append('section', formData.section);
        formDataToSend.append('visibilityDate', formData.visibilityDate1);
        formDataToSend.append('hyperlink', formData.hyperlink1);

        // Append years as JSON string
        formDataToSend.append('years', JSON.stringify(formData.years));

        // Optional custom title (we can add a title field later if needed, default is handled in backend)
        const response = await fetch('http://localhost:5000/api/notices', {
          method: 'POST',
          body: formDataToSend,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Successfully saved to backend:', result);

          // Show alert, then redirect to Dashboard
          alert(`${formData.section === 'notice' ? 'Notice' : 'Event'} added successfully!`);

          // Clear saved draft if any
          localStorage.removeItem('addNoticeEventForm');

          onNavigateToDashboard();
        } else {
          console.error('Failed to save to backend');
          alert('Failed to save. Please try again later.');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('An error occurred. Please make sure the backend server is running.');
      }
    }
  };

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
            {/* Title Field - Mandatory */}
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

            {/* First Photo Section - Mandatory */}
            <div className="form-section">
              <label className="section-label">
                add a photo {formData.section === 'event' && '(optional)'}
                {formData.section === 'notice' && <span className="required">*</span>}
              </label>
              <div className="photo-input-wrapper">
                <input
                  type="file"
                  id="photo1"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e, 'photo1')}
                  className="photo-input"
                />
                <label htmlFor="photo1" className="photo-label">
                  {formData.photo1Preview ? (
                    <img src={formData.photo1Preview} alt="Preview" className="photo-preview" />
                  ) : (
                    <div className="photo-placeholder">Click to add photo</div>
                  )}
                </label>
              </div>
              {errors.photo1 && <span className="error-text">{errors.photo1}</span>}
            </div>

            {/* Visibility Date 1 - Mandatory */}
            <div className="form-section">
              <label htmlFor="visibilityDate1" className="field-label">
                visibility date
                <span className="required">*</span>
              </label>
              <input
                type="date"
                id="visibilityDate1"
                value={formData.visibilityDate1}
                onChange={(e) => handleInputChange(e, 'visibilityDate1')}
                className={`form-input ${errors.visibilityDate1 ? 'error' : ''}`}
              />
              {errors.visibilityDate1 && <span className="error-text">{errors.visibilityDate1}</span>}
            </div>

            {/* Hyperlink 1 - Mandatory */}
            <div className="form-section">
              <label htmlFor="hyperlink1" className="field-label">
                hyperlink
                <span className="required">*</span>
              </label>
              <input
                type="url"
                id="hyperlink1"
                placeholder="https://example.com"
                value={formData.hyperlink1}
                onChange={(e) => handleInputChange(e, 'hyperlink1')}
                className={`form-input ${errors.hyperlink1 ? 'error' : ''}`}
              />
              {errors.hyperlink1 && <span className="error-text">{errors.hyperlink1}</span>}
            </div>

            {/* Second Photo Section - Optional */}
            <div className="form-section">
              <label className="section-label">add a photo (optional)</label>
              <div className="photo-input-wrapper">
                <input
                  type="file"
                  id="photo2"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e, 'photo2')}
                  className="photo-input"
                />
                <label htmlFor="photo2" className="photo-label">
                  {formData.photo2Preview ? (
                    <img src={formData.photo2Preview} alt="Preview" className="photo-preview" />
                  ) : (
                    <div className="photo-placeholder">Click to add photo</div>
                  )}
                </label>
              </div>
            </div>

            {/* Visibility Date 2 - Optional */}
            <div className="form-section">
              <label htmlFor="visibilityDate2" className="field-label">visibility date</label>
              <input
                type="date"
                id="visibilityDate2"
                value={formData.visibilityDate2}
                onChange={(e) => handleInputChange(e, 'visibilityDate2')}
                className="form-input"
              />
            </div>

            {/* Hyperlink 2 - Optional */}
            <div className="form-section">
              <label htmlFor="hyperlink2" className="field-label">hyperlink</label>
              <input
                type="url"
                id="hyperlink2"
                placeholder="https://example.com"
                value={formData.hyperlink2}
                onChange={(e) => handleInputChange(e, 'hyperlink2')}
                className="form-input"
              />
            </div>

            {/* Section Dropdown - Mandatory */}
            <div className="form-section">
              <label htmlFor="section" className="field-label">
                Section
                <span className="required">*</span>
              </label>
              <select
                id="section"
                value={formData.section}
                onChange={(e) => handleInputChange(e, 'section')}
                className={`form-select ${errors.section ? 'error' : ''}`}
              >
                <option value="notice">Notice</option>
                <option value="event">Event</option>
              </select>
              {errors.section && <span className="error-text">{errors.section}</span>}
            </div>

            {/* Year Level Multi-Select - Mandatory */}
            <div className="form-section">
              <label className="field-label">
                Display for year levels
                <span className="required">*</span>
              </label>
              <div className={`year-checkbox-group ${errors.years ? 'error' : ''}`}>
                <label className="year-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.years.includes('1st')}
                    onChange={() => handleYearToggle('1st')}
                    className="year-checkbox"
                  />
                  <span className="checkbox-text">1st Year</span>
                </label>
                <label className="year-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.years.includes('2nd')}
                    onChange={() => handleYearToggle('2nd')}
                    className="year-checkbox"
                  />
                  <span className="checkbox-text">2nd Year</span>
                </label>
                <label className="year-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.years.includes('3rd')}
                    onChange={() => handleYearToggle('3rd')}
                    className="year-checkbox"
                  />
                  <span className="checkbox-text">3rd Year</span>
                </label>
                <label className="year-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.years.includes('4th')}
                    onChange={() => handleYearToggle('4th')}
                    className="year-checkbox"
                  />
                  <span className="checkbox-text">4th Year</span>
                </label>
              </div>
              {errors.years && <span className="error-text">{errors.years}</span>}
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              Submit
            </button>
          </form>
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          <button className="nav-icon" onClick={onNavigateToDashboard}>🏠</button>
          <button className="nav-icon" onClick={onNavigateToSearch}>🔍</button>
          <button className="nav-icon" onClick={onNavigateToHistory}>🕐</button>
          <button className="nav-icon active">➕</button>
        </div>

        {/* Home Indicator */}
        <div className="home-indicator"></div>
        <SidePanel
          open={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          user={user}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
};

export default AddNoticeEvent;
