import React from 'react';

interface TermsPageProps {
  onNavigate: (path: string) => void;
}

interface TermsSection {
  id: string;
  number: string;
  title: string;
  content: React.ReactNode;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  const sections: TermsSection[] = [
    {
      id: 'general-terms',
      number: '1',
      title: 'GENERAL TERMS',
      content: (
        <>
          <p><strong>1.1.</strong> These Terms govern the use of DELIVA&apos;s website, mobile applications, and associated delivery services.</p>
          <p><strong>1.2.</strong> These Terms apply to all individuals and entities accessing or using the Platform, including registered users, customers, and businesses requesting delivery services, except where separate agreements apply.</p>
          <p><strong>1.3.</strong> By accessing or using the Platform, you confirm that you accept these Terms and agree to comply with all applicable provisions.</p>
          <p><strong>1.4.</strong> DELIVA reserves the right to amend, update, or modify these Terms when necessary to reflect changes in our services, business operations, legal requirements, or Platform features.</p>
          <p><strong>1.5.</strong> Where material changes are made, DELIVA will take reasonable steps to notify affected Users through the Platform or other appropriate communication channels.</p>
          <p><strong>1.6.</strong> Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms, subject to applicable law.</p>
          <p><strong>1.7.</strong> A violation of these Terms may result in restrictions, suspension, or termination of access to the Platform or relevant services.</p>
        </>
      ),
    },
    {
      id: 'description-of-services',
      number: '2',
      title: 'DESCRIPTION OF SERVICES',
      content: (
        <>
          <p><strong>2.1.</strong> DELIVA provides technology-enabled last-mile delivery coordination services through its Platform.</p>
          <p><strong>2.2.</strong> The Platform enables Users to request, arrange, monitor, and manage the delivery of eligible goods between designated pickup and delivery locations.</p>
          <p><strong>2.3.</strong> DELIVA&apos;s services may include:</p>
          <ul className="dg-legal-list">
            <li>Creation and management of delivery requests.</li>
            <li>Coordination and assignment of delivery partners.</li>
            <li>Collection of packages from designated pickup locations.</li>
            <li>Transportation and delivery of packages to specified destinations.</li>
            <li>Delivery status updates and tracking.</li>
            <li>Proof of delivery and delivery confirmation.</li>
            <li>Customer support and delivery-related assistance.</li>
          </ul>
          <p><strong>2.4.</strong> The availability of specific services and Platform features may vary depending on location, operational capacity, and the features made available by DELIVA from time to time.</p>
          <p><strong>2.5.</strong> DELIVA primarily facilitates the delivery of goods belonging to businesses, merchants, and individuals. DELIVA does not ordinarily own, manufacture, or sell the goods being transported.</p>
          <p><strong>2.6.</strong> Unless expressly agreed otherwise in writing, the sale, description, quality, authenticity, ownership, and suitability of goods remain the responsibility of the relevant seller or merchant.</p>
          <p><strong>2.7.</strong> DELIVA may establish separate agreements, policies, and operating requirements for merchants and delivery partners. Where applicable, those additional terms will apply alongside these Terms.</p>
        </>
      ),
    },
    {
      id: 'accessing-the-platform',
      number: '3',
      title: 'ACCESSING THE PLATFORM',
      content: (
        <>
          <p><strong>3.1.</strong> DELIVA does not guarantee that the Platform or its services will always be available, uninterrupted, secure, or free from technical errors.</p>
          <p><strong>3.2.</strong> DELIVA may temporarily suspend access to the Platform to carry out maintenance, upgrades, security reviews, or other operational activities.</p>
          <p><strong>3.3.</strong> DELIVA may introduce, modify, restrict, or discontinue certain Platform features where reasonably necessary.</p>
          <p><strong>3.4.</strong> Users are responsible for obtaining and maintaining the devices, internet access, and other resources necessary to use the Platform.</p>
          <p><strong>3.5.</strong> Users must ensure that their use of the Platform complies with these Terms and all applicable laws and regulations.</p>
        </>
      ),
    },
    {
      id: 'user-eligibility-and-registration',
      number: '4',
      title: 'USER ELIGIBILITY AND REGISTRATION',
      content: (
        <>
          <p><strong>4.1.</strong> Users must be at least eighteen (16) years old and legally capable of entering into binding agreements under applicable Nigerian law.</p>
          <p><strong>4.2.</strong> To access certain services, Users may be required to create an account by providing information requested by DELIVA.</p>
          <p><strong>4.3.</strong> Registration information may include:</p>
          <ul className="dg-legal-list">
            <li>Full name.</li>
            <li>Valid email address.</li>
            <li>Active telephone number.</li>
            <li>Delivery or business address, where applicable.</li>
            <li>Other information reasonably required to provide or verify the services.</li>
          </ul>
          <p><strong>4.4.</strong> Users agree that all information submitted during registration or subsequent account updates must be accurate, complete, and current.</p>
          <p><strong>4.5.</strong> Users are responsible for updating their account information whenever relevant details change.</p>
          <p><strong>4.6.</strong> DELIVA may request additional information or documentation where necessary to verify a User&apos;s identity, prevent fraud, protect the Platform, or comply with applicable legal requirements.</p>
          <p><strong>4.7.</strong> Users are responsible for maintaining the confidentiality of their account credentials and must not share their login details with unauthorised persons.</p>
          <p><strong>4.8.</strong> Users are responsible for activities carried out through their accounts, except where unauthorised activity results from circumstances for which DELIVA is legally responsible.</p>
          <p><strong>4.9.</strong> If a User suspects that their account has been compromised, accessed without permission, or used fraudulently, they must notify DELIVA immediately.</p>
          <p><strong>4.10.</strong> DELIVA reserves the right to restrict, suspend, or deactivate accounts where there is reasonable suspicion of fraudulent activity, security breaches, false information, or violations of these Terms.</p>
        </>
      ),
    },
    {
      id: 'delivery-requests-and-order-management',
      number: '5',
      title: 'DELIVERY REQUESTS AND ORDER MANAGEMENT',
      content: (
        <>
          <p><strong>5.1.</strong> Users may submit delivery requests through the Platform by providing the information required to facilitate the requested delivery.</p>
          <p><strong>5.2.</strong> A delivery request may require:</p>
          <ul className="dg-legal-list">
            <li>Pickup location.</li>
            <li>Delivery destination.</li>
            <li>Recipient&apos;s name and contact details.</li>
            <li>Description of the package.</li>
            <li>Package size, weight, or other relevant specifications.</li>
            <li>Special handling instructions, where applicable.</li>
          </ul>
          <p><strong>5.3.</strong> Users are responsible for ensuring that all delivery information submitted is accurate and complete.</p>
          <p><strong>5.4.</strong> DELIVA may review delivery requests and determine whether they can be accepted based on service availability, operational capacity, location, package specifications, and applicable restrictions.</p>
          <p><strong>5.5.</strong> Submission of a delivery request does not automatically guarantee acceptance or fulfilment.</p>
          <p><strong>5.6.</strong> A delivery request will be considered accepted when confirmation is communicated through the Platform or another official DELIVA communication channel.</p>
          <p><strong>5.7.</strong> DELIVA reserves the right to decline, cancel, or suspend a delivery request where:</p>
          <ul className="dg-legal-list">
            <li>The requested delivery is outside our service coverage.</li>
            <li>The package contains prohibited or restricted items.</li>
            <li>The delivery information is incomplete or inaccurate.</li>
            <li>The package does not meet our operational or safety requirements.</li>
            <li>The requested delivery cannot reasonably be completed.</li>
            <li>There are reasonable grounds to suspect fraud or unlawful activity.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'delivery-fees-and-payment',
      number: '6',
      title: 'DELIVERY FEES AND PAYMENT',
      content: (
        <>
          <p><strong>6.1.</strong> Delivery fees and other applicable charges will be communicated to Users before confirmation of a delivery request.</p>
          <p><strong>6.2.</strong> Delivery fees may vary depending on factors such as:</p>
          <ul className="dg-legal-list">
            <li>Distance between pickup and delivery locations.</li>
            <li>Package size and weight.</li>
            <li>Delivery location.</li>
            <li>Service type.</li>
            <li>Other relevant operational considerations.</li>
          </ul>
          <p><strong>6.3.</strong> Users agree to pay the applicable fees communicated at the point of booking, unless a different payment arrangement has been expressly agreed with DELIVA.</p>
          <p><strong>6.4.</strong> Payments made through the Platform may be processed by authorised third-party payment service providers.</p>
          <p><strong>6.5.</strong> Users acknowledge that third-party payment providers may have separate terms and conditions governing their payment services.</p>
          <p><strong>6.6.</strong> DELIVA will not knowingly charge Users for services or amounts that were not disclosed or otherwise agreed to, except where additional charges arise under an applicable policy or agreement.</p>
          <p><strong>6.7.</strong> DELIVA reserves the right to revise its delivery fees and pricing structure from time to time. Any applicable revised charges will be communicated before the User confirms a new delivery request.</p>
          <p><strong>6.8.</strong> Where a payment is unsuccessful, incomplete, reversed, or disputed, DELIVA may suspend the relevant delivery request while the payment issue is investigated.</p>
        </>
      ),
    },
    {
      id: 'delivery-responsibilities',
      number: '7',
      title: 'DELIVERY RESPONSIBILITIES',
      content: (
        <>
          <p><strong>7.1.</strong> Users agree to provide accurate pickup and delivery information and ensure that packages are properly prepared for collection.</p>
          <p><strong>7.2.</strong> Users must ensure that the package is appropriately packaged, secured, and suitable for transportation.</p>
          <p><strong>7.3.</strong> Users are responsible for accurately describing the contents of packages and disclosing any special handling requirements.</p>
          <p><strong>7.4.</strong> DELIVA will coordinate delivery activities through its delivery network and applicable operational procedures.</p>
          <p><strong>7.5.</strong> Delivery partners are expected to handle packages responsibly and follow the applicable delivery procedures communicated by DELIVA.</p>
          <p><strong>7.6.</strong> Recipients must make reasonable arrangements to receive deliveries at the designated destination.</p>
          <p><strong>7.7.</strong> Users are responsible for ensuring that the recipient&apos;s contact information and delivery address are correct.</p>
          <p><strong>7.8.</strong> DELIVA may provide delivery status updates and proof of delivery through available Platform features.</p>
          <p><strong>7.9.</strong> Delivery timelines provided through the Platform are estimates unless expressly confirmed as guaranteed delivery commitments.</p>
          <p><strong>7.10.</strong> DELIVA will make reasonable efforts to facilitate deliveries within communicated timelines but does not guarantee that every delivery will be completed within a particular period.</p>
        </>
      ),
    },
    {
      id: 'failed-delayed-or-unsuccessful-deliveries',
      number: '8',
      title: 'FAILED, DELAYED, OR UNSUCCESSFUL DELIVERIES',
      content: (
        <>
          <p><strong>8.1.</strong> A delivery may be delayed or unsuccessful due to circumstances including:</p>
          <ul className="dg-legal-list">
            <li>Incorrect pickup or delivery information.</li>
            <li>Recipient unavailability.</li>
            <li>Inability to access the delivery location.</li>
            <li>Traffic congestion or road conditions.</li>
            <li>Severe weather or other environmental conditions.</li>
            <li>Vehicle breakdowns or operational disruptions.</li>
            <li>Security incidents.</li>
            <li>Other circumstances beyond reasonable operational control.</li>
          </ul>
          <p><strong>8.2.</strong> Where a delivery cannot be completed, DELIVA will take reasonable steps to communicate the issue to the relevant User and determine an appropriate next step.</p>
          <p><strong>8.3.</strong> Depending on the circumstances, this may include arranging another delivery attempt, returning the package to the pickup location, or agreeing on another reasonable arrangement.</p>
          <p><strong>8.4.</strong> Additional charges may apply where a failed delivery or additional delivery attempt results from inaccurate information, recipient unavailability, or other circumstances attributable to the User. Any applicable charges must be communicated before they are imposed.</p>
          <p><strong>8.5.</strong> DELIVA may investigate reported delivery failures and take appropriate corrective action in accordance with its operational procedures.</p>
        </>
      ),
    },
    {
      id: 'cancellations-and-refunds',
      number: '9',
      title: 'CANCELLATIONS AND REFUNDS',
      content: (
        <>
          <p><strong>9.1.</strong> Users may request the cancellation of a delivery through the Platform or official DELIVA support channels.</p>
          <p><strong>9.2.</strong> Whether a cancellation can be accepted may depend on the stage of the delivery process.</p>
          <p><strong>9.3.</strong> A cancellation request made before a delivery partner has been assigned or the package collected may be handled differently from a request made after collection or while the package is in transit.</p>
          <p><strong>9.4.</strong> Where a cancellation request is received after a delivery has commenced, DELIVA may assess any costs already incurred and communicate any applicable charges before processing the cancellation.</p>
          <p><strong>9.5.</strong> Refunds may be considered where:</p>
          <ul className="dg-legal-list">
            <li>A User has paid for a delivery that DELIVA is unable to provide.</li>
            <li>A payment has been duplicated or incorrectly processed.</li>
            <li>A delivery is cancelled under circumstances that qualify for a refund.</li>
            <li>Another circumstance recognised under DELIVA&apos;s applicable refund policy arises.</li>
          </ul>
          <p><strong>9.6.</strong> Refund requests will be reviewed based on the circumstances of the transaction and relevant payment records.</p>
          <p><strong>9.7.</strong> Where a refund is approved, it will be processed through the original payment channel or another appropriate method communicated by DELIVA.</p>
          <p><strong>9.8.</strong> Refund processing times may depend on the relevant payment service provider and financial institution.</p>
          <p><strong>9.9.</strong> DELIVA will not deny a refund where applicable Nigerian law requires one.</p>
        </>
      ),
    },
    {
      id: 'prohibited-and-restricted-items',
      number: '10',
      title: 'PROHIBITED AND RESTRICTED ITEMS',
      content: (
        <>
          <p><strong>10.1.</strong> Users must not request the transportation of goods that are illegal, dangerous, prohibited, or restricted under applicable Nigerian law or DELIVA&apos;s operating policies.</p>
          <p><strong>10.2.</strong> Prohibited items may include:</p>
          <ul className="dg-legal-list">
            <li>Illegal drugs and controlled substances.</li>
            <li>Firearms, ammunition, and explosives.</li>
            <li>Hazardous chemicals and dangerous materials.</li>
            <li>Stolen or unlawfully obtained goods.</li>
            <li>Counterfeit goods.</li>
            <li>Items prohibited by applicable law.</li>
            <li>Any other goods that DELIVA reasonably determines cannot be safely or lawfully transported.</li>
          </ul>
          <p><strong>10.3.</strong> DELIVA reserves the right to reject delivery requests involving prohibited or restricted goods.</p>
          <p><strong>10.4.</strong> Users must not conceal the contents of packages or provide misleading descriptions intended to bypass DELIVA&apos;s restrictions.</p>
          <p><strong>10.5.</strong> Where a User submits a delivery request involving prohibited goods, DELIVA may suspend the delivery, restrict the relevant account, and report suspected unlawful activity to the appropriate authorities where required or permitted by law.</p>
        </>
      ),
    },
    {
      id: 'user-conduct-and-restricted-activities',
      number: '11',
      title: 'USER CONDUCT AND RESTRICTED ACTIVITIES',
      content: (
        <>
          <p><strong>11.1.</strong> Users agree to use the Platform only for lawful purposes and in accordance with these Terms.</p>
          <p><strong>11.2.</strong> Users must not:</p>
          <ul className="dg-legal-list">
            <li>Provide false or misleading information.</li>
            <li>Use the Platform to facilitate fraudulent or unlawful activities.</li>
            <li>Harass, threaten, abuse, or intimidate delivery partners, other Users, or DELIVA personnel.</li>
            <li>Interfere with the proper functioning or security of the Platform.</li>
            <li>Attempt to gain unauthorised access to another User&apos;s account.</li>
            <li>Manipulate delivery requests, payments, or Platform records.</li>
            <li>Upload malicious software or harmful content.</li>
            <li>Reverse engineer, copy, modify, or exploit DELIVA&apos;s software without authorisation.</li>
            <li>Use the Platform in a manner that compromises the safety of other Users or delivery partners.</li>
          </ul>
          <p><strong>11.3.</strong> DELIVA reserves the right to investigate suspected violations and take appropriate action in accordance with these Terms and applicable law.</p>
        </>
      ),
    },
    {
      id: 'intellectual-property',
      number: '12',
      title: 'INTELLECTUAL PROPERTY',
      content: (
        <>
          <p><strong>12.1.</strong> DELIVA owns or holds the necessary licences and permissions to use the intellectual property associated with its Platform, brand, software, logos, designs, content, and related materials.</p>
          <p><strong>12.2.</strong> These materials are protected by applicable intellectual property laws.</p>
          <p><strong>12.3.</strong> Users are granted a limited, non-exclusive, non-transferable, and revocable right to access and use the Platform for its intended purposes.</p>
          <p><strong>12.4.</strong> Users must not reproduce, distribute, modify, sell, exploit, or commercially use DELIVA&apos;s intellectual property without prior written authorisation.</p>
          <p><strong>12.5.</strong> Nothing in these Terms transfers ownership of DELIVA&apos;s intellectual property to any User.</p>
          <p><strong>12.6.</strong> Users who believe that material available on the Platform infringes their intellectual property rights may contact DELIVA through its official support channels.</p>
        </>
      ),
    },
    {
      id: 'limitation-of-liability',
      number: '13',
      title: 'LIMITATION OF LIABILITY',
      content: (
        <>
          <p><strong>13.1.</strong> DELIVA will exercise reasonable care in providing and coordinating its services.</p>
          <p><strong>13.2.</strong> DELIVA does not guarantee that the Platform will always be available, uninterrupted, or free from technical errors.</p>
          <p><strong>13.3.</strong> DELIVA will not be responsible for losses arising from inaccurate information supplied by Users, including incorrect pickup locations, delivery addresses, recipient details, or package descriptions, except where DELIVA is legally responsible for the relevant loss.</p>
          <p><strong>13.4.</strong> DELIVA is not responsible for the quality, authenticity, legality, or ownership of goods supplied by independent sellers or merchants.</p>
          <p><strong>13.5.</strong> Nothing in these Terms excludes or limits liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any other liability that cannot lawfully be excluded or limited under Nigerian law.</p>
          <p><strong>13.6.</strong> Any limitation of DELIVA&apos;s liability will apply only to the extent permitted by applicable law and will not remove rights that Users have under mandatory consumer protection laws.</p>
        </>
      ),
    },
    {
      id: 'indemnification',
      number: '14',
      title: 'INDEMNIFICATION',
      content: (
        <>
          <p><strong>14.1.</strong> To the extent permitted by applicable law, Users agree to indemnify DELIVA against reasonable losses, liabilities, claims, and expenses arising directly from:</p>
          <ul className="dg-legal-list">
            <li>Their breach of these Terms.</li>
            <li>Their fraudulent or unlawful use of the Platform.</li>
            <li>Their provision of false or misleading information.</li>
            <li>Their request to transport prohibited or unlawful goods.</li>
            <li>Their infringement of the rights of another person through their use of the Platform.</li>
          </ul>
          <p><strong>14.2.</strong> This provision does not apply to losses caused by DELIVA&apos;s own negligence, misconduct, breach of law, or other circumstances for which DELIVA is legally responsible.</p>
        </>
      ),
    },
    {
      id: 'account-suspension-and-termination',
      number: '15',
      title: 'ACCOUNT SUSPENSION AND TERMINATION',
      content: (
        <>
          <p><strong>15.1.</strong> Users may stop using the Platform and request account closure through DELIVA&apos;s official support channels or available account settings.</p>
          <p><strong>15.2.</strong> DELIVA may restrict, suspend, or terminate a User&apos;s access to the Platform where:</p>
          <ul className="dg-legal-list">
            <li>The User violates these Terms.</li>
            <li>The User engages in fraudulent or unlawful activity.</li>
            <li>The User provides false or misleading information.</li>
            <li>The User compromises the safety or security of the Platform.</li>
            <li>Continued access presents a material operational, legal, or security risk.</li>
          </ul>
          <p><strong>15.3.</strong> Where reasonably practicable and legally permissible, DELIVA will notify the affected User of the reason for suspension or termination.</p>
          <p><strong>15.4.</strong> Account closure does not automatically extinguish outstanding payment obligations or liabilities arising before termination.</p>
          <p><strong>15.5.</strong> Personal data associated with a closed account will be handled in accordance with DELIVA&apos;s Privacy Policy and applicable data protection and retention requirements.</p>
        </>
      ),
    },
    {
      id: 'electronic-communication',
      number: '16',
      title: 'ELECTRONIC COMMUNICATION',
      content: (
        <>
          <p><strong>16.1.</strong> By using the Platform, Users consent to receiving service-related communications electronically.</p>
          <p><strong>16.2.</strong> These communications may include:</p>
          <ul className="dg-legal-list">
            <li>Account registration and verification messages.</li>
            <li>Delivery confirmations.</li>
            <li>Delivery status notifications.</li>
            <li>Payment confirmations.</li>
            <li>Service updates.</li>
            <li>Security alerts.</li>
            <li>Changes to these Terms and applicable policies.</li>
          </ul>
          <p><strong>16.3.</strong> DELIVA may communicate through the Platform, email, SMS, telephone, or other contact details supplied by the User.</p>
          <p><strong>16.4.</strong> Users agree that electronic records, confirmations, and communications may be used as evidence of transactions and interactions, subject to applicable law.</p>
          <p><strong>16.5.</strong> Marketing communications will be handled in accordance with applicable consent and data protection requirements.</p>
          <p><strong>16.6.</strong> For safety, professionalism and proper coordination, Delivery Partners are not permitted to respond to customer or merchant phone calls, text messages, WhatsApp messages or other direct communications while actively riding or transporting a package.</p>
          <p><strong>16.7.</strong> Where a customer or merchant attempts to contact a Delivery Partner during transit, All communication, enquiries, complaints, delivery updates or special instructions during this period must be directed through the DELIVA Support Team.</p>
          <p>This policy is intended to minimise distractions, improve rider safety, protect customer experience and ensure that delivery-related communication is properly documented and coordinated by DELIVA.</p>
        </>
      ),
    },
    {
      id: 'personal-data-and-privacy',
      number: '17',
      title: 'PERSONAL DATA AND PRIVACY',
      content: (
        <>
          <p><strong>17.1.</strong> DELIVA collects and processes personal information necessary to provide, manage, secure, and improve its services.</p>
          <p><strong>17.2.</strong> Such information may include names, contact details, delivery addresses, transaction information, location information, and other information relevant to the use of the Platform.</p>
          <p><strong>17.3.</strong> Personal data may be shared with delivery partners, payment service providers, technology providers, and other authorised service providers where reasonably necessary to facilitate services or comply with legal obligations.</p>
          <p><strong>17.4.</strong> DELIVA will handle personal information in accordance with its{' '}
            <button
              type="button"
              className="dg-inline-link"
              onClick={() => onNavigate('/privacy')}
            >
              Privacy Policy
            </button>{' '}
            and applicable Nigerian data protection laws, including the Nigeria Data Protection Act 2023.
          </p>
          <p><strong>17.5.</strong> Users are encouraged to read DELIVA&apos;s{' '}
            <button
              type="button"
              className="dg-inline-link"
              onClick={() => onNavigate('/privacy')}
            >
              Privacy Policy
            </button>{' '}
            to understand how their information is collected, used, stored, shared, and protected.
          </p>
          <p><strong>17.6.</strong> Users may exercise applicable data protection rights through DELIVA&apos;s designated privacy contact.</p>
        </>
      ),
    },
    {
      id: 'complaints-and-dispute-resolution',
      number: '18',
      title: 'COMPLAINTS AND DISPUTE RESOLUTION',
      content: (
        <>
          <p><strong>18.1.</strong> Users may submit complaints, concerns, or reports relating to deliveries, payments, account access, or other Platform activities through DELIVA&apos;s official customer support channels.</p>
          <p><strong>18.2.</strong> Complaints should include relevant information such as the delivery reference, date of transaction, description of the issue, and supporting evidence where available.</p>
          <p><strong>18.3.</strong> DELIVA will make reasonable efforts to review and resolve complaints within a reasonable period.</p>
          <p><strong>18.4.</strong> Where a complaint requires further investigation, DELIVA may request additional information from the relevant parties.</p>
          <p><strong>18.5.</strong> DELIVA encourages Users to first seek an amicable resolution through its customer support channels.</p>
          <p><strong>18.6.</strong> Nothing in this section prevents a User from exercising any legal rights or seeking remedies available under applicable Nigerian law.</p>
        </>
      ),
    },
    {
      id: 'force-majeure',
      number: '19',
      title: 'FORCE MAJEURE',
      content: (
        <>
          <p><strong>19.1.</strong> DELIVA will not be considered in breach of these Terms where its ability to perform an obligation is prevented or materially affected by circumstances beyond its reasonable control.</p>
          <p><strong>19.2.</strong> Such circumstances may include natural disasters, severe weather, civil unrest, strikes, government restrictions, security emergencies, widespread network failures, or other events beyond reasonable control.</p>
          <p><strong>19.3.</strong> DELIVA will take reasonable steps to minimise the effects of such circumstances and communicate material service disruptions to affected Users where practicable.</p>
        </>
      ),
    },
    {
      id: 'severability',
      number: '20',
      title: 'SEVERABILITY',
      content: (
        <>
          <p><strong>20.1.</strong> If any provision of these Terms is found to be invalid, unlawful, or unenforceable by a competent authority, that provision will be interpreted or modified to the extent necessary to make it enforceable, where legally possible.</p>
          <p><strong>20.2.</strong> If it cannot be made enforceable, the affected provision will be severed from these Terms without affecting the validity of the remaining provisions.</p>
        </>
      ),
    },
    {
      id: 'governing-law',
      number: '21',
      title: 'GOVERNING LAW',
      content: (
        <>
          <p><strong>21.1.</strong> These Terms are governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria.</p>
          <p><strong>21.2.</strong> Any dispute arising from the interpretation, application, or enforcement of these Terms will be handled in accordance with applicable Nigerian law and by the courts of competent jurisdiction in Nigeria.</p>
        </>
      ),
    },
    {
      id: 'contact-information',
      number: '22',
      title: 'CONTACT INFORMATION',
      content: (
        <>
          <p>For questions, complaints, or requests relating to these Terms, Users may contact DELIVA through the following official channels:</p>
          <div className="dg-legal-contact-card">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:support@delivaglobe.com" className="dg-inline-link">
                support@delivaglobe.com
              </a>
            </p>
            <p>
              <strong>Website:</strong>{' '}
              <a
                href="https://www.delivaglobe.com"
                target="_blank"
                rel="noreferrer"
                className="dg-inline-link"
              >
                www.delivaglobe.com
              </a>
            </p>
            <p>
              <strong>Business Address:</strong> white house, ejionye ndubisi lodge by adawari hostel, omuokiri Aluu
            </p>
            <p>
              <strong>Phone No:</strong>{' '}
              <a href="tel:+2347015548163" className="dg-inline-link">
                +2347015548163
              </a>
            </p>
          </div>
        </>
      ),
    },
    {
      id: 'version-control',
      number: '23',
      title: 'VERSION CONTROL',
      content: (
        <div className="dg-legal-version-box">
          <p>These Terms and Conditions were issued by Deliva Globe Ltd and may be updated from time to time.</p>
          <p><strong>Document Title:</strong> DELIVA Platform Terms and Conditions</p>
          <p><strong>Version:</strong> 1.0</p>
          <p><strong>Last Updated:</strong> November 2026.</p>
          <p>©2026, Deliva Globe Ltd. All rights reserved.</p>
          <p className="dg-legal-motto">DELIVA — Beyond delivery</p>
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
            DELIVA GLOBE LTD TERMS AND CONDITIONS OF USE
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
                <p><strong>Welcome to DELIVA.</strong></p>
                <p>
                  DELIVA is a technology-enabled last-mile logistics platform operated by Deliva Globe Ltd (&quot;DELIVA&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
                </p>
                <p>
                  Our platform connects businesses and individuals requiring delivery services with delivery partners who facilitate the movement of goods from designated pickup locations to specified delivery destinations.
                </p>
                <p>
                  These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the DELIVA website, mobile applications, and associated services (collectively referred to as the &quot;Platform&quot;).
                </p>
                <p>
                  By accessing, registering on, or using our Platform, you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) acknowledge that you have read, understood, and agreed to be bound by these Terms and our applicable{' '}
                  <button
                    type="button"
                    className="dg-inline-link"
                    onClick={() => onNavigate('/privacy')}
                  >
                    Privacy Policy
                  </button>.
                </p>
                <p>
                  Please read these Terms carefully before using our Platform.
                </p>
                <p>
                  If you do not agree with any part of these Terms, you should discontinue your use of the Platform.
                </p>
                <p>
                  For questions or clarification regarding these Terms, please contact us through our official customer support channels.{' '}
                  <a href="mailto:support@delivaglobe.com" className="dg-inline-link">
                    support@delivaglobe.com
                  </a>.
                </p>
              </div>
            </section>

            {/* Numbered Sections 1 - 23 */}
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

