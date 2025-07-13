import HomepageHeaderWLogo from '../components/HomepageHeaderWLogo';
import logo from '../assets/logo.svg';
import InputWLabel from '../components/InputWLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import SecondaryBtn from '../components/SecondaryBtn';
import { useNavigate } from 'react-router-dom';
import UploadDocument from '../components/UploadDocument';
import FileItem from '../components/FileItem';
import '../styles/Home.scss';
import { useState } from 'react';

const IntakeProcess = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');

    const handleFileUpload = (newFiles) => {
        // Only add files that are not already in the list (by name and size)
        setFiles(prevFiles => {
            const existing = prevFiles.map(f => f.name + f.size);
            return [...prevFiles, ...newFiles.filter(f => !existing.includes(f.name + f.size))];
        });
    };

    const handleRemoveFile = (idx) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== idx));
    };

    return (
        <div className='homepage-container'>
            <HomepageHeaderWLogo headerText="Intake Process" logo={logo} logoAltText="GenAI AgentOS Logo" caption="Upload your insurance benefits so we can make suggestions based on insurance benefits." />
            <UploadDocument
                text="Drag and drop to upload employer benefit documents in txt, pdf format under 10MB"
                onFileUpload={handleFileUpload}
                onError={setError}
                multiple={true}
            />
            {files.map((file, idx) => (
                <FileItem key={file.name + file.size} file={file} onRemove={() => handleRemoveFile(idx)} />
            ))}
            {error && <div className="upload-error" style={{marginTop: 8, textAlign: 'center'}}>{error}</div>}
            <div className='form-btn-container' style={{marginBottom: 20}}>
                <PrimaryBtn text="Confirm Upload" onClick={() => {navigate('/benefitsoverview')}} />
            </div>
        </div>
    );
};

export default IntakeProcess;