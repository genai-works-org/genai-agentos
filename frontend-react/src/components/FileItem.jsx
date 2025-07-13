import React from 'react';
import './FileItem.scss';
import { FiX } from 'react-icons/fi';

const formatSize = (size) => {
  if (size >= 1024 * 1024) return `${Math.round(size / (1024 * 1024))}MB`;
  if (size >= 1024) return `${Math.round(size / 1024)}KB`;
  return `${size}B`;
};

const FileItem = ({ file, onRemove, maxNameLength = 28 }) => {
  let name = file.name;
  if (name.length > maxNameLength) {
    const ext = name.split('.').pop();
    name = name.slice(0, maxNameLength - ext.length - 4) + '...' + ext;
  }
  return (
    <div className="file-item">
      <span className="file-name">{name}</span>
      <span className="file-size">{formatSize(file.size)}</span>
      <button className="file-remove" onClick={onRemove} aria-label="Remove file">
        <FiX size={30} color="#FF535C" />
      </button>
    </div>
  );
};

export default FileItem; 