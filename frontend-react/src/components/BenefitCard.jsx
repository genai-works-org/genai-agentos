import React from 'react';
import './BenefitCard.scss';

const BenefitCard = ({ heading, description }) => (
  <div className="benefit-card">
    <div className="benefit-card-heading">{heading}</div>
    <div className="benefit-card-description">{description}</div>
  </div>
);

export default BenefitCard; 