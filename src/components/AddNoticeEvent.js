import React, { useState } from 'react';
import './AddNoticeEvent.css';

const AddNoticeEvent = ({ onNavigateToDashboard }) => {
  const [formData, setFormData] = useState({
    photo1: null,
    photo1Preview: null,
    visibilityDate1: '',
    hyperlink1: '',
    photo2: null,
    photo2Preview: null,
    visibilityDate2: '',
    hyperlink2: '',
    section: 'notice'
  });

  const [errors, setErrors] = useState({});

  const handlePhotoChange = (e, photoField) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [photoField]: file,
          [photoField.replace('photo', 'photoPreview')]: reader.result
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.photo1) {
      newErrors.photo1 = 'Photo is required';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
      // Handle form submission here
      alert('Notice/Event added successfully!');
    }
  };

  return (
    <div className="add-notice-container">
      <div className="add-notice-card">
        {/* Status Bar */}
        <div className="status-bar">
          <span className="time">9:41</span>
          <div className="status-icons">
            <span>📶</span>
            <span>📡</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Header */}
        <div className="add-notice-header">
          <h1 className="web-title">web title</h1>
          <div className="profile-icon">👤</div>
        </div>

        {/* Form Content */}
        <div className="add-notice-content">
          <form onSubmit={handleSubmit}>
            {/* First Photo Section - Mandatory */}
            <div className="form-section">
              <label className="section-label">
                add a photo
                <span className="required">*</span>
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

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              Submit
            </button>
          </form>
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          <button className="nav-icon" onClick={onNavigateToDashboard}>🏠</button>
          <button className="nav-icon">🔍</button>
          <button className="nav-icon">🕐</button>
          <button className="nav-icon active">➕</button>
        </div>

        {/* Home Indicator */}
        <div className="home-indicator"></div>
      </div>
    </div>
  );
};

export default AddNoticeEvent;
