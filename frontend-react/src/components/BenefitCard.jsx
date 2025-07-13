import React from 'react';
import './BenefitCard.scss';

const BenefitCard = ({ icon, title, description }) => (
  <div className="benefit-card">
    <div className="benefit-card-icon-circle">{icon}</div>
    <div className="benefit-card-title">{title}</div>
    <div className="benefit-card-description">{description}</div>
  </div>
);

export default BenefitCard; 