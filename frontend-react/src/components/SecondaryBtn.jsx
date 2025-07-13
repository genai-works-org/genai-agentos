import './SecondaryBtn.scss';
const SecondaryBtn = ({text, onClick}) => {
    return (
        <button className="secondary-btn" onClick={onClick}>{text}</button>
    );
};

export default SecondaryBtn;