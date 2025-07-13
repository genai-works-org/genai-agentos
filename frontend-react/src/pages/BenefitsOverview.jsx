import HomepageHeaderWLogo from "../components/HomepageHeaderWLogo";
import logo from '../assets/logo.svg';
import BenefitCard from '../components/BenefitCard';
import PrimaryBtn from '../components/PrimaryBtn';

const benefits = [
  {
    heading: "$50 Off Uber to Medical Appointments",
    description: "Use your health plan’s transportation benefit to get discounted rides to and from doctor visits."
  },
  {
    heading: "Free Annual Physical",
    description: "Get a free annual checkup with your primary care provider as part of your preventive care benefits."
  },
  {
    heading: "Prescription Discounts",
    description: "Save on prescription medications at participating pharmacies with your health plan."
  }
];

const BenefitsOverview = () => {
    return(
        <div className="homepage-container">    
            <HomepageHeaderWLogo headerText="Benefits Overview" logo={logo} logoAltText="GenAI AgentOS Logo" caption="Here’s what your health plan includes no digging through PDFs required." />
            {benefits.map((b, i) => (
              <BenefitCard key={i} heading={b.heading} description={b.description} />
            ))}
            <div className='form-btn-container' style={{marginBottom: 20}}>
                <PrimaryBtn text="Start Chating" onClick={() => {}} />
            </div>
        </div>
    )
}

export default BenefitsOverview;