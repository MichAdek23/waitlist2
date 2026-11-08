import React from 'react';

interface PrivacyPageProps {
  onNavigate: (path: string) => void;
}

interface PrivacySection {
  id: string;
  number: string;
  title: string;
  content: React.ReactNode;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  const sections: PrivacySection[] = [
    {
      id: 'changes-to-this-privacy-policy',
      number: '1',
      title: 'CHANGES TO THIS PRIVACY POLICY',
      content: (
        <>
          <p>We may update this Privacy Policy from time to time to reflect changes in our services, technology, business operations, legal obligations or data protection practices.</p>
          <p>Where changes are made, we will update the revised Policy on our website, mobile applications or other relevant communication channels.</p>
          <p>Where a change materially affects your privacy rights or how we process your personal information, we will take reasonable steps to bring the change to your attention.</p>
          <p>The updated Policy will take effect from the date stated in the revised version.</p>
          <p>We encourage you to review this Policy periodically to remain informed about how DELIVA handles personal information.</p>
        </>
      ),
    },
    {
      id: 'personal-information-we-collect',
      number: '2',
      title: 'PERSONAL INFORMATION WE COLLECT',
      content: (
        <>
          <p>The information we collect depends on how you interact with DELIVA and which services you use.</p>
          <p>We aim to collect only information that is reasonably necessary for providing our services, managing our operations, meeting legal obligations and improving the DELIVA platform.</p>

          <h3 className="dg-legal-subheading">2.1. Information Collected from Users and Customers</h3>
          <p>When you register, request a delivery or use DELIVA&apos;s services, we may collect:</p>
          <ul className="dg-legal-list">
            <li>Full name.</li>
            <li>Phone number.</li>
            <li>Email address.</li>
            <li>Delivery and pickup addresses.</li>
            <li>Account login information.</li>
            <li>Delivery instructions.</li>
            <li>Recipient details provided for a delivery.</li>
            <li>Delivery request and transaction history.</li>
            <li>Payment confirmation and transaction references.</li>
            <li>Customer support communications and complaints.</li>
            <li>Relevant location information, where permitted.</li>
          </ul>

          <h3 className="dg-legal-subheading">2.2. Information Collected from Merchants</h3>
          <p>When a business registers or uses DELIVA to arrange deliveries, we may collect:</p>
          <ul className="dg-legal-list">
            <li>Business name and contact details.</li>
            <li>Business address and operating location.</li>
            <li>Name and contact details of authorised representatives.</li>
            <li>Business registration information, where required.</li>
            <li>Account and login information.</li>
            <li>Pickup and delivery addresses.</li>
            <li>Delivery requests and transaction records.</li>
            <li>Payment and settlement information.</li>
            <li>Relevant business verification documents.</li>
            <li>Communications with DELIVA&apos;s support and operations teams.</li>
          </ul>
          <p>Where a merchant provides personal information about its employees, customers or representatives, the merchant is responsible for ensuring that it has the necessary authority or lawful basis to provide that information to DELIVA.</p>

          <h3 className="dg-legal-subheading">2.3. Information Collected from Delivery Partners</h3>
          <p>Individuals applying to become DELIVA Delivery Partners may be required to provide information necessary for registration, identity verification, onboarding, delivery coordination and operational management.</p>
          <p>This may include:</p>
          <ul className="dg-legal-list">
            <li>Full name.</li>
            <li>Date of birth or age confirmation.</li>
            <li>Phone number and email address.</li>
            <li>Residential address.</li>
            <li>Government-issued identification.</li>
            <li>Passport photograph.</li>
            <li>Driver&apos;s licence, where applicable.</li>
            <li>Vehicle registration details.</li>
            <li>Vehicle type, make, model, colour and plate number.</li>
            <li>Proof of vehicle ownership or authorisation to use the vehicle.</li>
            <li>Next-of-kin information.</li>
            <li>Guarantor information and supporting documents, where required.</li>
            <li>Payment and settlement details.</li>
            <li>Delivery history and performance records.</li>
            <li>Training, onboarding and verification records.</li>
            <li>Reports, complaints or incident records relating to delivery activities.</li>
          </ul>
          <p>We may also collect information relating to a rider&apos;s vehicle, delivery activity and compliance with DELIVA&apos;s operational and safety requirements.</p>

          <h3 className="dg-legal-subheading">2.4. Information Collected Through Communication</h3>
          <p>When you contact DELIVA through our support channels, email, telephone, mobile application or other approved communication channels, we may collect and retain relevant information from those interactions.</p>
          <p>This may include:</p>
          <ul className="dg-legal-list">
            <li>The content of messages and enquiries.</li>
            <li>Complaint details.</li>
            <li>Feedback and suggestions.</li>
            <li>Information provided during dispute resolution.</li>
            <li>Relevant attachments, photographs or supporting documents.</li>
          </ul>
          <p>Where calls or communications are recorded, we will provide appropriate notice where required by law.</p>

          <h3 className="dg-legal-subheading">2.5. Information Collected Automatically</h3>
          <p>When you access or use our website, mobile applications or digital services, we may automatically collect certain technical information, including:</p>
          <ul className="dg-legal-list">
            <li>Device type and operating system.</li>
            <li>Application version.</li>
            <li>IP address.</li>
            <li>Device identifiers.</li>
            <li>Browser type.</li>
            <li>Network and connection information.</li>
            <li>Application usage information.</li>
            <li>Login activity and timestamps.</li>
            <li>Error reports and diagnostic information.</li>
          </ul>
          <p>We use this information to maintain the security, functionality and performance of our digital services.</p>
        </>
      ),
    },
    {
      id: 'how-we-collect-personal-information',
      number: '3',
      title: 'HOW WE COLLECT PERSONAL INFORMATION',
      content: (
        <>
          <p>We may collect personal information through different methods, including:</p>

          <h3 className="dg-legal-subheading">3.1. Directly from You</h3>
          <p>We collect information when you:</p>
          <ul className="dg-legal-list">
            <li>Create or update an account.</li>
            <li>Register as a customer, merchant or delivery partner.</li>
            <li>Request or receive a delivery.</li>
            <li>Submit onboarding or verification documents.</li>
            <li>Make a payment through an approved payment channel.</li>
            <li>Contact our customer support team.</li>
            <li>Submit a complaint, review or feedback.</li>
            <li>Participate in a survey, promotion or research activity.</li>
            <li>Communicate with DELIVA through our website, applications, email or other channels.</li>
          </ul>

          <h3 className="dg-legal-subheading">3.2. Automatically Through Our Platform</h3>
          <p>We may collect technical, usage and location-related information through your interaction with the DELIVA website, mobile applications and services, subject to your device permissions and applicable law.</p>

          <h3 className="dg-legal-subheading">3.3. From Third Parties</h3>
          <p>Where lawful and necessary, we may receive relevant information from:</p>
          <ul className="dg-legal-list">
            <li>Payment service providers.</li>
            <li>Identity verification providers.</li>
            <li>Business verification services.</li>
            <li>Fraud prevention and security providers.</li>
            <li>Merchants and business representatives.</li>
            <li>Delivery partners.</li>
            <li>Other service providers supporting our operations.</li>
          </ul>
          <p>We will process personal information obtained from third parties in accordance with applicable data protection requirements.</p>
        </>
      ),
    },
    {
      id: 'location-information',
      number: '4',
      title: 'LOCATION INFORMATION',
      content: (
        <>
          <p>Location information is important to coordinating pickup and delivery services.</p>
          <p>Depending on the service being used and the permissions granted on your device, DELIVA may collect location information through GPS, IP address or other available location technologies.</p>

          <h3 className="dg-legal-subheading">4.1. Users and Customers</h3>
          <p>We may use location information to:</p>
          <ul className="dg-legal-list">
            <li>Identify or confirm pickup and delivery locations.</li>
            <li>Coordinate delivery requests.</li>
            <li>Provide relevant delivery updates.</li>
            <li>Support delivery tracking where available.</li>
            <li>Resolve delivery-related complaints.</li>
            <li>Improve delivery coordination and service efficiency.</li>
          </ul>

          <h3 className="dg-legal-subheading">4.2. Delivery Partners</h3>
          <p>We may collect a Delivery Partner&apos;s location during active delivery activities, subject to applicable permissions and legal requirements.</p>
          <p>This information may be used to:</p>
          <ul className="dg-legal-list">
            <li>Coordinate delivery assignments.</li>
            <li>Support pickup and delivery operations.</li>
            <li>Provide delivery progress updates where available.</li>
            <li>Assist with route coordination.</li>
            <li>Investigate delivery incidents.</li>
            <li>Improve operational efficiency and rider safety.</li>
          </ul>
          <p>Location permissions may be managed through your device settings. However, disabling certain location permissions may affect your ability to use features that depend on location information.</p>
          <p>DELIVA will not use location information for purposes unrelated to its services unless permitted by law or otherwise appropriately authorised.</p>
        </>
      ),
    },
    {
      id: 'cookies-and-similar-technologies',
      number: '5',
      title: 'COOKIES AND SIMILAR TECHNOLOGIES',
      content: (
        <>
          <p>Where our website or digital services use cookies or similar technologies, we may use them to:</p>
          <ul className="dg-legal-list">
            <li>Improve website functionality.</li>
            <li>Remember certain user preferences.</li>
            <li>Understand how visitors interact with our website.</li>
            <li>Monitor website performance.</li>
            <li>Identify technical problems.</li>
            <li>Improve the relevance and usability of our services.</li>
          </ul>
          <p>Cookies are small files stored on your device by a website. They may help a website recognise a returning visitor or remember certain preferences.</p>
          <p>You may manage or disable cookies through your browser settings. However, disabling certain cookies may affect the functionality of some website features.</p>
          <p>Where required by applicable law, we will provide appropriate information and obtain consent before using non-essential cookies or similar tracking technologies.</p>
        </>
      ),
    },
    {
      id: 'how-we-use-your-personal-information',
      number: '6',
      title: 'HOW WE USE YOUR PERSONAL INFORMATION',
      content: (
        <>
          <p>DELIVA may use personal information for the following purposes:</p>

          <h3 className="dg-legal-subheading">6.1. Providing Delivery Services</h3>
          <p>To:</p>
          <ul className="dg-legal-list">
            <li>Create and manage user accounts.</li>
            <li>Receive and process delivery requests.</li>
            <li>Coordinate merchants, customers and delivery partners.</li>
            <li>Assign and manage delivery requests.</li>
            <li>Facilitate pickup and delivery activities.</li>
            <li>Provide delivery updates and notifications.</li>
            <li>Confirm successful or unsuccessful deliveries.</li>
            <li>Maintain delivery records.</li>
          </ul>

          <h3 className="dg-legal-subheading">6.2. Account Management and Verification</h3>
          <p>To:</p>
          <ul className="dg-legal-list">
            <li>Verify user identities where necessary.</li>
            <li>Review merchant registration information.</li>
            <li>Verify delivery partner identities and documents.</li>
            <li>Manage account access.</li>
            <li>Prevent unauthorised account use.</li>
            <li>Maintain accurate account records.</li>
          </ul>

          <h3 className="dg-legal-subheading">6.3. Payment and Financial Administration</h3>
          <p>To:</p>
          <ul className="dg-legal-list">
            <li>Facilitate payment for delivery services.</li>
            <li>Confirm payment transactions.</li>
            <li>Process eligible rider payments and settlements.</li>
            <li>Maintain transaction records.</li>
            <li>Investigate payment discrepancies.</li>
            <li>Meet financial, accounting and regulatory obligations.</li>
          </ul>
          <p>DELIVA does not intend to collect or store full payment card details unless this is specifically required and appropriately secured. Where payments are processed through third-party payment providers, their applicable privacy and security policies may also apply.</p>

          <h3 className="dg-legal-subheading">6.4. Customer Support and Communication</h3>
          <p>To:</p>
          <ul className="dg-legal-list">
            <li>Respond to enquiries.</li>
            <li>Provide delivery assistance.</li>
            <li>Resolve complaints and disputes.</li>
            <li>Communicate service updates.</li>
            <li>Investigate delivery-related incidents.</li>
            <li>Notify users of changes affecting their accounts or services.</li>
          </ul>

          <h3 className="dg-legal-subheading">6.5. Safety, Security and Fraud Prevention</h3>
          <p>To:</p>
          <ul className="dg-legal-list">
            <li>Protect users, merchants and delivery partners.</li>
            <li>Detect and prevent fraudulent activities.</li>
            <li>Investigate suspicious transactions.</li>
            <li>Review reported incidents.</li>
            <li>Maintain platform security.</li>
            <li>Enforce our Terms and Conditions.</li>
            <li>Protect the integrity of our delivery network.</li>
          </ul>

          <h3 className="dg-legal-subheading">6.6. Service Improvement and Development</h3>
          <p>To:</p>
          <ul className="dg-legal-list">
            <li>Understand how users interact with our platform.</li>
            <li>Identify technical and operational problems.</li>
            <li>Improve delivery coordination.</li>
            <li>Evaluate service performance.</li>
            <li>Develop new features and services.</li>
            <li>Conduct internal research and analysis.</li>
            <li>Improve the overall customer and delivery partner experience.</li>
          </ul>
          <p>Where possible, we may use aggregated or de-identified information for analysis and service improvement.</p>

          <h3 className="dg-legal-subheading">6.7. Marketing and Promotional Communication</h3>
          <p>Where permitted by law and subject to applicable consent requirements, we may use your contact information to communicate information about DELIVA&apos;s services, updates, offers or promotions.</p>
          <p>You may opt out of promotional communications at any time.</p>
          <p>However, opting out of marketing messages will not prevent us from sending essential service communications, such as delivery updates, account notices, security alerts or payment confirmations.</p>

          <h3 className="dg-legal-subheading">6.8. Legal and Regulatory Compliance</h3>
          <p>We may process personal information where necessary to:</p>
          <ul className="dg-legal-list">
            <li>Comply with applicable laws and regulations.</li>
            <li>Respond to lawful requests from regulatory or law enforcement authorities.</li>
            <li>Establish, exercise or defend legal claims.</li>
            <li>Maintain appropriate financial and operational records.</li>
            <li>Protect the rights, safety and property of DELIVA and other individuals.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'lawful-basis-for-processing',
      number: '7',
      title: 'LAWFUL BASIS FOR PROCESSING',
      content: (
        <>
          <p>DELIVA processes personal information only where an appropriate lawful basis exists under applicable data protection laws.</p>
          <p>Depending on the circumstances, these lawful bases may include:</p>

          <h3 className="dg-legal-subheading">7.1. Performance of a Contract</h3>
          <p>We may process personal information where necessary to provide services you have requested or to take steps at your request before entering into an agreement.</p>
          <p>For example, we may use your name, phone number and delivery address to coordinate a delivery.</p>

          <h3 className="dg-legal-subheading">7.2. Consent</h3>
          <p>We may process certain personal information based on your consent, particularly where consent is required for specific activities such as certain marketing communications or optional data collection.</p>
          <p>Where processing is based on consent, you may withdraw that consent at any time. Withdrawal does not affect the lawfulness of processing carried out before withdrawal.</p>

          <h3 className="dg-legal-subheading">7.3. Legal Obligations</h3>
          <p>We may process personal information where necessary to comply with applicable legal or regulatory requirements.</p>

          <h3 className="dg-legal-subheading">7.4. Legitimate Interests</h3>
          <p>We may process personal information where necessary for legitimate business purposes, provided those interests do not override your rights and freedoms.</p>
          <p>These purposes may include fraud prevention, platform security, service improvement, operational management and dispute resolution.</p>

          <h3 className="dg-legal-subheading">7.5. Vital Interests and Other Lawful Grounds</h3>
          <p>In limited circumstances, we may process personal information where necessary to protect someone&apos;s vital interests or where another lawful basis recognised by applicable data protection law applies.</p>
        </>
      ),
    },
    {
      id: 'sharing-and-disclosure-of-personal-information',
      number: '8',
      title: 'SHARING AND DISCLOSURE OF PERSONAL INFORMATION',
      content: (
        <>
          <p>DELIVA does not sell personal information to third parties.</p>
          <p>However, we may share relevant personal information where necessary to provide our services, operate our business, meet legal obligations or protect the rights and safety of individuals.</p>
          <p>Information may be shared with the following categories of recipients:</p>

          <h3 className="dg-legal-subheading">8.1. Delivery Partners</h3>
          <p>We may share relevant delivery information with assigned Delivery Partners, including:</p>
          <ul className="dg-legal-list">
            <li>Customer or recipient name.</li>
            <li>Pickup and delivery addresses.</li>
            <li>Contact details necessary for completing the delivery.</li>
            <li>Delivery instructions.</li>
            <li>Relevant package or delivery information.</li>
          </ul>
          <p>This information is shared to enable the assigned rider to complete the delivery.</p>

          <h3 className="dg-legal-subheading">8.2. Users and Merchants</h3>
          <p>We may share relevant delivery information between customers and merchants to facilitate delivery coordination, order fulfilment and issue resolution.</p>
          <p>Only information reasonably necessary for the relevant service should be shared.</p>

          <h3 className="dg-legal-subheading">8.3. Payment Service Providers</h3>
          <p>We may share relevant transaction information with payment service providers to process payments, confirm transactions, manage settlements and investigate payment-related issues.</p>

          <h3 className="dg-legal-subheading">8.4. Technology and Operational Service Providers</h3>
          <p>We may share information with trusted service providers who support our operations, including:</p>
          <ul className="dg-legal-list">
            <li>Cloud hosting and storage providers.</li>
            <li>Software and technology providers.</li>
            <li>Communication and notification providers.</li>
            <li>Identity verification providers.</li>
            <li>Analytics and security providers.</li>
            <li>Customer support service providers.</li>
          </ul>
          <p>Such providers should only process personal information in accordance with applicable agreements, authorised instructions and relevant data protection requirements.</p>

          <h3 className="dg-legal-subheading">8.5. Professional Advisers</h3>
          <p>Where necessary, we may share information with professional advisers, including legal practitioners, auditors, accountants and financial advisers, subject to appropriate confidentiality obligations.</p>

          <h3 className="dg-legal-subheading">8.6. Government and Regulatory Authorities</h3>
          <p>We may disclose personal information to courts, law enforcement agencies, regulators or other public authorities where required or permitted by applicable law.</p>

          <h3 className="dg-legal-subheading">8.7. Business Transactions</h3>
          <p>If DELIVA undergoes a merger, acquisition, restructuring, financing or transfer of business assets, relevant personal information may be disclosed as part of that process, subject to applicable data protection requirements.</p>
          <p>Where necessary, we will take reasonable steps to ensure that any recipient handles the information appropriately.</p>
        </>
      ),
    },
    {
      id: 'third-party-services-and-links',
      number: '9',
      title: 'THIRD-PARTY SERVICES AND LINKS',
      content: (
        <>
          <p>Our website, mobile applications or other digital services may contain links to third-party websites, applications or services.</p>
          <p>We may also rely on third-party providers to support payment processing, identity verification, hosting, communications, analytics and other operational functions.</p>
          <p>These third parties may have their own privacy policies and data protection practices.</p>
          <p>DELIVA is not responsible for the independent privacy practices of third-party websites or services that it does not control.</p>
          <p>We encourage you to review the relevant privacy policies before providing personal information directly to third-party services.</p>
          <p>Where a third-party service processes personal information on DELIVA&apos;s behalf, we will take reasonable steps to ensure that appropriate contractual and data protection safeguards are in place.</p>
        </>
      ),
    },
    {
      id: 'communications-and-customer-support',
      number: '10',
      title: 'COMMUNICATIONS AND CUSTOMER SUPPORT',
      content: (
        <>
          <p>DELIVA may communicate with you through the contact information associated with your account or provided during your interaction with our services.</p>
          <p>These communications may include:</p>
          <ul className="dg-legal-list">
            <li>Account registration and verification messages.</li>
            <li>Delivery confirmations and updates.</li>
            <li>Pickup and delivery notifications.</li>
            <li>Payment confirmations.</li>
            <li>Service announcements.</li>
            <li>Customer support responses.</li>
            <li>Security notifications.</li>
            <li>Relevant operational instructions.</li>
          </ul>
          <p>Communications may take place through the DELIVA platform, telephone, email, SMS, WhatsApp or other approved channels.</p>
          <p>Where communications are recorded or retained, the information may be used for customer support, quality assurance, fraud prevention, operational monitoring and dispute resolution, in accordance with applicable law.</p>

          <h3 className="dg-legal-subheading">Communication During Delivery Transit</h3>
          <p>For safety and proper coordination, DELIVA may require Delivery Partners not to respond to customer or merchant calls and messages while actively riding or transporting packages.</p>
          <p>During this period, delivery-related enquiries, complaints, instructions and requests for assistance should be directed through the DELIVA Support Team.</p>
          <p>Relevant communications between users, riders and the support team may be retained where necessary to coordinate deliveries, resolve complaints and maintain accurate operational records.</p>
        </>
      ),
    },
    {
      id: 'surveys-feedback-and-research',
      number: '11',
      title: 'SURVEYS, FEEDBACK AND RESEARCH',
      content: (
        <>
          <p>DELIVA may invite users, merchants and delivery partners to participate in optional surveys, interviews or research activities to help us understand their experiences and improve our services.</p>
          <p>Where you voluntarily participate, we may collect the information you provide, including feedback, opinions and relevant service experiences.</p>
          <p>We will inform you where additional personal information is requested for a research activity and obtain consent where required.</p>
          <p>Participation in optional surveys or research activities is voluntary and will not ordinarily affect your ability to use DELIVA&apos;s services.</p>
        </>
      ),
    },
    {
      id: 'data-security',
      number: '12',
      title: 'DATA SECURITY',
      content: (
        <>
          <p>DELIVA takes reasonable technical and organisational measures to protect personal information against:</p>
          <ul className="dg-legal-list">
            <li>Unauthorised access.</li>
            <li>Loss or destruction.</li>
            <li>Unauthorised disclosure.</li>
            <li>Alteration or misuse.</li>
            <li>Unlawful processing.</li>
            <li>Other forms of security compromise.</li>
          </ul>
          <p>Depending on the nature of the information and the risks involved, our security measures may include access controls, authentication procedures, encryption, secure system configurations, staff confidentiality requirements and monitoring of relevant systems.</p>
          <p>We also take reasonable steps to limit access to personal information to individuals and service providers who need it for authorised business purposes.</p>
          <p>However, no digital platform, internet transmission or storage system can be guaranteed to be completely secure.</p>
          <p>You are responsible for keeping your account credentials confidential and notifying DELIVA promptly if you suspect unauthorised access to your account.</p>
          <p>Where a personal data breach occurs, DELIVA will take appropriate steps to investigate, contain and address the incident and make any notifications required by applicable law.</p>
        </>
      ),
    },
    {
      id: 'international-data-transfers',
      number: '13',
      title: 'INTERNATIONAL DATA TRANSFERS',
      content: (
        <>
          <p>Some of the technology or service providers supporting DELIVA may process or store personal information outside Nigeria.</p>
          <p>Where personal information is transferred outside Nigeria, DELIVA will take reasonable steps to ensure that the transfer complies with applicable data protection laws.</p>
          <p>This may include assessing the destination country&apos;s data protection framework and implementing appropriate safeguards or other lawful transfer mechanisms where required.</p>
          <p>We will not knowingly transfer personal information internationally without an appropriate lawful basis and required safeguards.</p>
        </>
      ),
    },
    {
      id: 'retention-of-personal-information',
      number: '14',
      title: 'RETENTION OF PERSONAL INFORMATION',
      content: (
        <>
          <p>DELIVA will retain personal information only for as long as reasonably necessary for the purposes for which it was collected, including the provision of services, operational management, dispute resolution, fraud prevention and compliance with legal obligations.</p>
          <p>Retention periods may vary depending on:</p>
          <ul className="dg-legal-list">
            <li>The type of personal information.</li>
            <li>The nature of the service provided.</li>
            <li>The status of the user&apos;s account.</li>
            <li>Financial and accounting requirements.</li>
            <li>Legal and regulatory obligations.</li>
            <li>Outstanding complaints, investigations or disputes.</li>
            <li>Legitimate business and security needs.</li>
          </ul>
          <p>For example, delivery and transaction records may need to be retained for a period required by applicable financial, tax or other laws.</p>
          <p>Where personal information is no longer required, DELIVA will take reasonable steps to securely delete, anonymise or de-identify it, subject to any legal obligation to retain the information.</p>
        </>
      ),
    },
    {
      id: 'your-data-protection-rights',
      number: '15',
      title: 'YOUR DATA PROTECTION RIGHTS',
      content: (
        <>
          <p>Subject to applicable law and relevant exceptions, you may have the right to:</p>

          <h3 className="dg-legal-subheading">15.1. Right to Be Informed</h3>
          <p>You have the right to receive information about how DELIVA collects and processes your personal information.</p>

          <h3 className="dg-legal-subheading">15.2. Right of Access</h3>
          <p>You may request confirmation of whether DELIVA holds personal information about you and request access to that information.</p>

          <h3 className="dg-legal-subheading">15.3. Right to Rectification</h3>
          <p>You may request that inaccurate, incomplete or outdated personal information be corrected or updated.</p>

          <h3 className="dg-legal-subheading">15.4. Right to Erasure</h3>
          <p>You may request the deletion of your personal information where the law permits.</p>
          <p>However, DELIVA may retain certain information where it is required to comply with legal obligations, resolve disputes, prevent fraud or protect legitimate business interests.</p>

          <h3 className="dg-legal-subheading">15.5. Right to Restrict Processing</h3>
          <p>You may request that DELIVA restrict the processing of your personal information in circumstances recognised by applicable law.</p>

          <h3 className="dg-legal-subheading">15.6. Right to Object</h3>
          <p>You may object to certain forms of processing, including processing based on legitimate interests or processing for direct marketing, subject to applicable legal provisions.</p>

          <h3 className="dg-legal-subheading">15.7. Right to Data Portability</h3>
          <p>Where applicable, you may request that certain personal information be provided to you or transferred to another organisation in a structured, commonly used and machine-readable format.</p>

          <h3 className="dg-legal-subheading">15.8. Right to Withdraw Consent</h3>
          <p>Where DELIVA relies on your consent to process personal information, you may withdraw that consent at any time.</p>

          <h3 className="dg-legal-subheading">15.9. Right to Lodge a Complaint</h3>
          <p>You may lodge a complaint with the Nigeria Data Protection Commission or another relevant supervisory authority where you believe your personal information has been processed unlawfully.</p>
          <p>To exercise any of these rights, contact DELIVA using the details provided in this Policy.</p>
          <p>We may request information necessary to verify your identity before responding to a request.</p>
        </>
      ),
    },
    {
      id: 'account-deactivation-and-deletion-requests',
      number: '16',
      title: 'ACCOUNT DEACTIVATION AND DELETION REQUESTS',
      content: (
        <>
          <p>Users, merchants and delivery partners may request account deactivation or deletion through DELIVA&apos;s approved support channels, subject to applicable platform procedures.</p>
          <p>Deactivating an account does not automatically mean that all associated personal information will be immediately deleted.</p>
          <p>DELIVA may retain certain information where necessary to:</p>
          <ul className="dg-legal-list">
            <li>Meet legal or regulatory obligations.</li>
            <li>Maintain financial and transaction records.</li>
            <li>Resolve outstanding complaints or disputes.</li>
            <li>Investigate suspected fraud or misconduct.</li>
            <li>Protect the security and integrity of the platform.</li>
            <li>Establish, exercise or defend legal claims.</li>
          </ul>
          <p>Where information is no longer required for these purposes, DELIVA will take reasonable steps to delete or anonymise it in accordance with its retention practices and applicable law.</p>
        </>
      ),
    },
    {
      id: 'childrens-privacy',
      number: '17',
      title: "CHILDREN'S PRIVACY",
      content: (
        <>
          <p>DELIVA&apos;s services are not intended for individuals who do not meet the minimum age requirements applicable to the relevant service.</p>
          <p>We do not knowingly collect personal information directly from children in violation of applicable data protection laws.</p>
          <p>Where we become aware that personal information has been collected from a child unlawfully or without the required authorisation, we will take appropriate steps to address the situation.</p>
        </>
      ),
    },
    {
      id: 'privacy-responsibilities',
      number: '18',
      title: 'PRIVACY RESPONSIBILITIES OF USERS, MERCHANTS AND DELIVERY PARTNERS',
      content: (
        <>
          <p>Everyone who uses DELIVA has a responsibility to handle personal information appropriately.</p>

          <h3 className="dg-legal-subheading">18.1. Users and Customers</h3>
          <p>You should provide accurate information and avoid sharing another person&apos;s personal information unless you have the necessary authority or lawful basis to do so.</p>

          <h3 className="dg-legal-subheading">18.2. Merchants</h3>
          <p>Merchants must ensure that personal information provided to DELIVA, including recipient names, telephone numbers and delivery addresses, is collected and shared lawfully.</p>
          <p>Merchants must not use DELIVA to disclose or process personal information for unauthorised purposes.</p>

          <h3 className="dg-legal-subheading">18.3. Delivery Partners</h3>
          <p>Delivery Partners may receive access to customer and merchant information to complete assigned deliveries.</p>
          <p>They must:</p>
          <ul className="dg-legal-list">
            <li>Use customer and merchant information only for authorised delivery purposes.</li>
            <li>Keep personal information confidential.</li>
            <li>Avoid sharing customer or merchant details with unauthorised persons.</li>
            <li>Not use delivery information for personal solicitation or private transactions.</li>
            <li>Not retain or misuse customer contact information after the delivery.</li>
            <li>Follow DELIVA&apos;s communication, safety and operational policies.</li>
          </ul>
          <p>Any suspected misuse or unauthorised disclosure of personal information should be reported to DELIVA promptly.</p>
        </>
      ),
    },
    {
      id: 'direct-marketing',
      number: '19',
      title: 'DIRECT MARKETING',
      content: (
        <>
          <p>DELIVA may send promotional information about its services, offers, updates and relevant activities where permitted by applicable law.</p>
          <p>Where consent is required, we will obtain it before sending promotional communications.</p>
          <p>You may opt out of marketing communications through the available unsubscribe option or by contacting our support team.</p>
          <p>Please note that opting out of marketing communications will not prevent DELIVA from sending essential service-related messages, including delivery updates, account notifications, security alerts and payment information.</p>
        </>
      ),
    },
    {
      id: 'data-protection-contact',
      number: '20',
      title: 'DATA PROTECTION CONTACT',
      content: (
        <>
          <p>DELIVA is committed to handling personal information responsibly and addressing privacy concerns.</p>
          <p>For questions, complaints, access requests, correction requests, deletion requests or other data protection enquiries, you may contact us through:</p>
          <div className="dg-legal-contact-card">
            <p><strong>Company:</strong> Deliva Globe Ltd</p>
            <p>
              <strong>Privacy Contact Email:</strong>{' '}
              <a href="mailto:privacy@delivaglobe.com" className="dg-inline-link">
                privacy@delivaglobe.com
              </a>
            </p>
            <p>
              <strong>Support Email:</strong>{' '}
              <a href="mailto:support@delivaglobe.com" className="dg-inline-link">
                support@delivaglobe.com
              </a>
            </p>
            <p>
              <strong>Phone Number:</strong>{' '}
              <a href="tel:+2347015548163" className="dg-inline-link">
                +2347015548163
              </a>
            </p>
            <p>
              <strong>Registered Business Address:</strong> White house, Ejionye Ndubisi lodge by Adawari hostel, Omuokiri, Aluu.
            </p>
          </div>
          <p>We will review privacy requests and respond within the timeframes required by applicable law.</p>
        </>
      ),
    },
    {
      id: 'governing-law',
      number: '21',
      title: 'GOVERNING LAW',
      content: (
        <>
          <p>This Privacy Policy shall be governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act 2023 and other applicable data protection laws and regulations.</p>
          <p>Where any provision of this Policy conflicts with a mandatory legal requirement, the applicable law shall prevail.</p>
        </>
      ),
    },
    {
      id: 'final-note',
      number: '22',
      title: 'FINAL NOTE',
      content: (
        <div className="dg-legal-version-box">
          <p>At DELIVA, we understand that reliable logistics depends not only on moving packages but also on maintaining the trust of the people and businesses that use our platform.</p>
          <p>We are committed to handling personal information responsibly, protecting the privacy of our users, merchants and delivery partners, and continually improving our data protection practices.</p>
          <p className="dg-legal-motto">DELIVA GLOBE LTD Beyond Delivery</p>
          <p>©2026, All right reserved</p>
        </div>
      ),
    },
  ];

  return (
    <main className="dg-legal-page">
      {/* Page Banner */}
      <section className="dg-legal-hero">
        <div className="dg-legal-hero-inner">
          <h1 className="dg-legal-main-title">
            DELIVA GLOBE LTD PRIVACY POLICY NOVEMBER 2026
          </h1>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="dg-legal-container">
        <div className="dg-legal-layout">
          {/* Sticky Sidebar Table of Contents */}
          <aside className="dg-legal-sidebar" aria-label="Table of contents">
            <div className="dg-legal-toc-card">
              <h2 className="dg-legal-toc-title">Table of Contents</h2>
              <nav className="dg-legal-toc-nav">
                <a href="#introduction" className="dg-legal-toc-link">
                  Introduction
                </a>
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="dg-legal-toc-link"
                  >
                    {sec.number}. {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Document Body */}
          <article className="dg-legal-article">
            {/* Introduction */}
            <section id="introduction" className="dg-legal-section dg-legal-intro-card">
              <h2 className="dg-legal-section-heading">INTRODUCTION</h2>
              <div className="dg-legal-section-body">
                <p>
                  Deliva Globe Ltd (&quot;DELIVA&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) operates a technology-enabled logistics platform that connects businesses and customers with delivery partners to facilitate reliable last-mile delivery services.
                </p>
                <p>
                  Our services enable users to request and manage deliveries, businesses to arrange deliveries for their customers, and delivery partners to receive and complete delivery requests through our platform.
                </p>
                <p>
                  At DELIVA, we recognise the importance of protecting the personal information entrusted to us. We are committed to transparency in how we collect, use, store, disclose and protect personal information belonging to individuals who interact with our services.
                </p>
                <p>This Privacy Policy explains how we handle personal information relating to:</p>
                <ul className="dg-legal-list">
                  <li>Customers and individuals who request or receive deliveries (&quot;Users&quot;).</li>
                  <li>Businesses and merchants who use DELIVA to arrange deliveries (&quot;Merchants&quot;).</li>
                  <li>Individuals who register to provide delivery services through DELIVA (&quot;Delivery Partners&quot; or &quot;Riders&quot;).</li>
                  <li>Individuals who visit our website, contact our support team or otherwise interact with DELIVA.</li>
                </ul>
                <p>
                  For the purpose of this Policy, personal information or personal data means information relating to an identified or identifiable individual.
                </p>
                <p>
                  We encourage you to read this Privacy Policy together with our applicable{' '}
                  <button
                    type="button"
                    className="dg-inline-link"
                    onClick={() => onNavigate('/terms')}
                  >
                    Terms and Conditions
                  </button>{' '}
                  and other relevant policies.
                </p>
                <p>
                  This Policy is intended to comply with applicable data protection laws in Nigeria, including the Nigeria Data Protection Act (NDPA) 2023 and any applicable regulations or guidance.
                </p>
                <p>
                  If you have questions about this Policy or how we handle your personal information, please contact us through the details provided at the end of this document.
                </p>
              </div>
            </section>

            {/* Numbered Sections 1 - 22 */}
            {sections.map((sec) => (
              <section key={sec.id} id={sec.id} className="dg-legal-section">
                <h2 className="dg-legal-section-heading">
                  <span className="dg-legal-sec-num">{sec.number}.</span> {sec.title}
                </h2>
                <div className="dg-legal-section-body">{sec.content}</div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </main>
  );
};
