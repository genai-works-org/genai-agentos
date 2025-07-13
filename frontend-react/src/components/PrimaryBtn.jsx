import './PrimaryBtn.scss';
const PrimaryBtn = ({text, onClick}) => {
    return (
        <button className="primary-btn" onClick={onClick}>{text}</button>
    );
};

export default PrimaryBtn;