import React, { useRef, useState } from 'react';
import './UploadDocument.scss';
import { FiUpload } from 'react-icons/fi';

const UploadDocument = ({
  fileSizeLimit = 10, // in MB
  accept = '.pdf,.txt',
  text = 'Drag and drop to upload employer benefit documents in txt, pdf format under 10MB',
  buttonText = 'Upload Document',
  onFileUpload = () => {},
  onError = () => {},
  multiple = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFiles = (files) => {
    const maxBytes = fileSizeLimit * 1024 * 1024;
    let validFiles = [];
    let errorMsg = '';
    files.forEach(fileObj => {
      if (fileObj.size > maxBytes) {
        errorMsg = `File '${fileObj.name}' must be under ${fileSizeLimit}MB.`;
      } else if (accept && !accept.split(',').some(type => fileObj.name.toLowerCase().endsWith(type.trim().replace('.', '')))) {
        errorMsg = `File type not accepted: ${fileObj.name}`;
      } else {
        validFiles.push(fileObj);
      }
    });
    setError(errorMsg);
    onError(errorMsg);
    if (validFiles.length > 0) {
      onFileUpload(validFiles);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  const openFileDialog = () => {
    inputRef.current.click();
  };

  return (
    <div
      className={`upload-document-card${dragActive ? ' drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <div className="upload-icon">
        <FiUpload size={72} color="#FF535C" />
      </div>
      <div className="upload-text">{text}</div>
      {error && <div className="upload-error">{error}</div>}
      <input
        type="file"
        ref={inputRef}
        style={{ display: 'none' }}
        accept={accept}
        onChange={handleChange}
        multiple={multiple}
      />
      <button className="upload-btn" onClick={openFileDialog} type="button">
        {buttonText}
      </button>
    </div>
  );
};

export default UploadDocument; 