export interface LegalSectionItem {
  id: string;
  number: string;
  title: string;
  content: string;
}

export interface LegalDocumentData {
  slug: 'terms' | 'privacy';
  title: string;
  documentTitle: string;
  version: string;
  updated_at: string;
  introductionTitle: string;
  introduction: string;
  sections: LegalSectionItem[];
}

export const DEFAULT_TERMS_DOC: LegalDocumentData = {
  slug: 'terms',
  title: 'DELIVA GLOBE LTD TERMS AND CONDITIONS OF USE',
  documentTitle: 'DELIVA Platform Terms and Conditions',
  version: '1.0',
  updated_at: '2026-11-07T22:30:00.000Z',
  introductionTitle: 'INTRODUCTION',
  introduction: `Welcome to DELIVA.
DELIVA is a technology-enabled last-mile logistics platform operated by Deliva Globe Ltd ("DELIVA", "we", "us", or "our").
Our platform connects businesses and individuals requiring delivery services with delivery partners who facilitate the movement of goods from designated pickup locations to specified delivery destinations.
These Terms and Conditions ("Terms") govern your access to and use of the DELIVA website, mobile applications, and associated services (collectively referred to as the "Platform").
By accessing, registering on, or using our Platform, you ("User", "you", or "your") acknowledge that you have read, understood, and agreed to be bound by these Terms and our applicable Privacy Policy.
Please read these Terms carefully before using our Platform.
If you do not agree with any part of these Terms, you should discontinue your use of the Platform.
For questions or clarification regarding these Terms, please contact us through our official customer support channels. support@delivaglobe.com.`,
  sections: [
    {
      id: 'general-terms',
      number: '1',
      title: 'GENERAL TERMS',
      content: `1.1. These Terms govern the use of DELIVA's website, mobile applications, and associated delivery services.
1.2. These Terms apply to all individuals and entities accessing or using the Platform, including registered users, customers, and businesses requesting delivery services, except where separate agreements apply.
1.3. By accessing or using the Platform, you confirm that you accept these Terms and agree to comply with all applicable provisions.
1.4. DELIVA reserves the right to amend, update, or modify these Terms when necessary to reflect changes in our services, business operations, legal requirements, or Platform features.
1.5. Where material changes are made, DELIVA will take reasonable steps to notify affected Users through the Platform or other appropriate communication channels.
1.6. Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms, subject to applicable law.
1.7. A violation of these Terms may result in restrictions, suspension, or termination of access to the Platform or relevant services.`,
    },
    {
      id: 'description-of-services',
      number: '2',
      title: 'DESCRIPTION OF SERVICES',
      content: `2.1. DELIVA provides technology-enabled last-mile delivery coordination services through its Platform.
2.2. The Platform enables Users to request, arrange, monitor, and manage the delivery of eligible goods between designated pickup and delivery locations.
2.3. DELIVA's services may include:
• Creation and management of delivery requests.
• Coordination and assignment of delivery partners.
• Collection of packages from designated pickup locations.
• Transportation and delivery of packages to specified destinations.
• Delivery status updates and tracking.
• Proof of delivery and delivery confirmation.
• Customer support and delivery-related assistance.
2.4. The availability of specific services and Platform features may vary depending on location, operational capacity, and the features made available by DELIVA from time to time.
2.5. DELIVA primarily facilitates the delivery of goods belonging to businesses, merchants, and individuals. DELIVA does not ordinarily own, manufacture, or sell the goods being transported.
2.6. Unless expressly agreed otherwise in writing, the sale, description, quality, authenticity, ownership, and suitability of goods remain the responsibility of the relevant seller or merchant.
2.7. DELIVA may establish separate agreements, policies, and operating requirements for merchants and delivery partners. Where applicable, those additional terms will apply alongside these Terms.`,
    },
    {
      id: 'accessing-the-platform',
      number: '3',
      title: 'ACCESSING THE PLATFORM',
      content: `3.1. DELIVA does not guarantee that the Platform or its services will always be available, uninterrupted, secure, or free from technical errors.
3.2. DELIVA may temporarily suspend access to the Platform to carry out maintenance, upgrades, security reviews, or other operational activities.
3.3. DELIVA may introduce, modify, restrict, or discontinue certain Platform features where reasonably necessary.
3.4. Users are responsible for obtaining and maintaining the devices, internet access, and other resources necessary to use the Platform.
3.5. Users must ensure that their use of the Platform complies with these Terms and all applicable laws and regulations.`,
    },
    {
      id: 'user-eligibility-and-registration',
      number: '4',
      title: 'USER ELIGIBILITY AND REGISTRATION',
      content: `4.1. Users must be at least eighteen (16) years old and legally capable of entering into binding agreements under applicable Nigerian law.
4.2. To access certain services, Users may be required to create an account by providing information requested by DELIVA.
4.3. Registration information may include:
• Full name.
• Valid email address.
• Active telephone number.
• Delivery or business address, where applicable.
• Other information reasonably required to provide or verify the services.
4.4. Users agree that all information submitted during registration or subsequent account updates must be accurate, complete, and current.
4.5. Users are responsible for updating their account information whenever relevant details change.
4.6. DELIVA may request additional information or documentation where necessary to verify a User's identity, prevent fraud, protect the Platform, or comply with applicable legal requirements.
4.7. Users are responsible for maintaining the confidentiality of their account credentials and must not share their login details with unauthorised persons.
4.8. Users are responsible for activities carried out through their accounts, except where unauthorised activity results from circumstances for which DELIVA is legally responsible.
4.9. If a User suspects that their account has been compromised, accessed without permission, or used fraudulently, they must notify DELIVA immediately.
4.10. DELIVA reserves the right to restrict, suspend, or deactivate accounts where there is reasonable suspicion of fraudulent activity, security breaches, false information, or violations of these Terms.`,
    },
    {
      id: 'delivery-requests-and-order-management',
      number: '5',
      title: 'DELIVERY REQUESTS AND ORDER MANAGEMENT',
      content: `5.1. Users may submit delivery requests through the Platform by providing the information required to facilitate the requested delivery.
5.2. A delivery request may require:
• Pickup location.
• Delivery destination.
• Recipient's name and contact details.
• Description of the package.
• Package size, weight, or other relevant specifications.
• Special handling instructions, where applicable.
5.3. Users are responsible for ensuring that all delivery information submitted is accurate and complete.
5.4. DELIVA may review delivery requests and determine whether they can be accepted based on service availability, operational capacity, location, package specifications, and applicable restrictions.
5.5. Submission of a delivery request does not automatically guarantee acceptance or fulfilment.
5.6. A delivery request will be considered accepted when confirmation is communicated through the Platform or another official DELIVA communication channel.
5.7. DELIVA reserves the right to decline, cancel, or suspend a delivery request where:
• The requested delivery is outside our service coverage.
• The package contains prohibited or restricted items.
• The delivery information is incomplete or inaccurate.
• The package does not meet our operational or safety requirements.
• The requested delivery cannot reasonably be completed.
• There are reasonable grounds to suspect fraud or unlawful activity.`,
    },
    {
      id: 'delivery-fees-and-payment',
      number: '6',
      title: 'DELIVERY FEES AND PAYMENT',
      content: `6.1. Delivery fees and other applicable charges will be communicated to Users before confirmation of a delivery request.
6.2. Delivery fees may vary depending on factors such as:
• Distance between pickup and delivery locations.
• Package size and weight.
• Delivery location.
• Service type.
• Other relevant operational considerations.
6.3. Users agree to pay the applicable fees communicated at the point of booking, unless a different payment arrangement has been expressly agreed with DELIVA.
6.4. Payments made through the Platform may be processed by authorised third-party payment service providers.
6.5. Users acknowledge that third-party payment providers may have separate terms and conditions governing their payment services.
6.6. DELIVA will not knowingly charge Users for services or amounts that were not disclosed or otherwise agreed to, except where additional charges arise under an applicable policy or agreement.
6.7. DELIVA reserves the right to revise its delivery fees and pricing structure from time to time. Any applicable revised charges will be communicated before the User confirms a new delivery request.
6.8. Where a payment is unsuccessful, incomplete, reversed, or disputed, DELIVA may suspend the relevant delivery request while the payment issue is investigated.`,
    },
    {
      id: 'delivery-responsibilities',
      number: '7',
      title: 'DELIVERY RESPONSIBILITIES',
      content: `7.1. Users agree to provide accurate pickup and delivery information and ensure that packages are properly prepared for collection.
7.2. Users must ensure that the package is appropriately packaged, secured, and suitable for transportation.
7.3. Users are responsible for accurately describing the contents of packages and disclosing any special handling requirements.
7.4. DELIVA will coordinate delivery activities through its delivery network and applicable operational procedures.
7.5. Delivery partners are expected to handle packages responsibly and follow the applicable delivery procedures communicated by DELIVA.
7.6. Recipients must make reasonable arrangements to receive deliveries at the designated destination.
7.7. Users are responsible for ensuring that the recipient's contact information and delivery address are correct.
7.8. DELIVA may provide delivery status updates and proof of delivery through available Platform features.
7.9. Delivery timelines provided through the Platform are estimates unless expressly confirmed as guaranteed delivery commitments.
7.10. DELIVA will make reasonable efforts to facilitate deliveries within communicated timelines but does not guarantee that every delivery will be completed within a particular period.`,
    },
    {
      id: 'failed-delayed-or-unsuccessful-deliveries',
      number: '8',
      title: 'FAILED, DELAYED, OR UNSUCCESSFUL DELIVERIES',
      content: `8.1. A delivery may be delayed or unsuccessful due to circumstances including:
• Incorrect pickup or delivery information.
• Recipient unavailability.
• Inability to access the delivery location.
• Traffic congestion or road conditions.
• Severe weather or other environmental conditions.
• Vehicle breakdowns or operational disruptions.
• Security incidents.
• Other circumstances beyond reasonable operational control.
8.2. Where a delivery cannot be completed, DELIVA will take reasonable steps to communicate the issue to the relevant User and determine an appropriate next step.
8.3. Depending on the circumstances, this may include arranging another delivery attempt, returning the package to the pickup location, or agreeing on another reasonable arrangement.
8.4. Additional charges may apply where a failed delivery or additional delivery attempt results from inaccurate information, recipient unavailability, or other circumstances attributable to the User. Any applicable charges must be communicated before they are imposed.
8.5. DELIVA may investigate reported delivery failures and take appropriate corrective action in accordance with its operational procedures.`,
    },
    {
      id: 'cancellations-and-refunds',
      number: '9',
      title: 'CANCELLATIONS AND REFUNDS',
      content: `9.1. Users may request the cancellation of a delivery through the Platform or official DELIVA support channels.
9.2. Whether a cancellation can be accepted may depend on the stage of the delivery process.
9.3. A cancellation request made before a delivery partner has been assigned or the package collected may be handled differently from a request made after collection or while the package is in transit.
9.4. Where a cancellation request is received after a delivery has commenced, DELIVA may assess any costs already incurred and communicate any applicable charges before processing the cancellation.
9.5. Refunds may be considered where:
• A User has paid for a delivery that DELIVA is unable to provide.
• A payment has been duplicated or incorrectly processed.
• A delivery is cancelled under circumstances that qualify for a refund.
• Another circumstance recognised under DELIVA's applicable refund policy arises.
9.6. Refund requests will be reviewed based on the circumstances of the transaction and relevant payment records.
9.7. Where a refund is approved, it will be processed through the original payment channel or another appropriate method communicated by DELIVA.
9.8. Refund processing times may depend on the relevant payment service provider and financial institution.
9.9. DELIVA will not deny a refund where applicable Nigerian law requires one.`,
    },
    {
      id: 'prohibited-and-restricted-items',
      number: '10',
      title: 'PROHIBITED AND RESTRICTED ITEMS',
      content: `10.1. Users must not request the transportation of goods that are illegal, dangerous, prohibited, or restricted under applicable Nigerian law or DELIVA's operating policies.
10.2. Prohibited items may include:
• Illegal drugs and controlled substances.
• Firearms, ammunition, and explosives.
• Hazardous chemicals and dangerous materials.
• Stolen or unlawfully obtained goods.
• Counterfeit goods.
• Items prohibited by applicable law.
• Any other goods that DELIVA reasonably determines cannot be safely or lawfully transported.
10.3. DELIVA reserves the right to reject delivery requests involving prohibited or restricted goods.
10.4. Users must not conceal the contents of packages or provide misleading descriptions intended to bypass DELIVA's restrictions.
10.5. Where a User submits a delivery request involving prohibited goods, DELIVA may suspend the delivery, restrict the relevant account, and report suspected unlawful activity to the appropriate authorities where required or permitted by law.`,
    },
    {
      id: 'user-conduct-and-restricted-activities',
      number: '11',
      title: 'USER CONDUCT AND RESTRICTED ACTIVITIES',
      content: `11.1. Users agree to use the Platform only for lawful purposes and in accordance with these Terms.
11.2. Users must not:
• Provide false or misleading information.
• Use the Platform to facilitate fraudulent or unlawful activities.
• Harass, threaten, abuse, or intimidate delivery partners, other Users, or DELIVA personnel.
• Interfere with the proper functioning or security of the Platform.
• Attempt to gain unauthorised access to another User's account.
• Manipulate delivery requests, payments, or Platform records.
• Upload malicious software or harmful content.
• Reverse engineer, copy, modify, or exploit DELIVA's software without authorisation.
• Use the Platform in a manner that compromises the safety of other Users or delivery partners.
11.3. DELIVA reserves the right to investigate suspected violations and take appropriate action in accordance with these Terms and applicable law.`,
    },
    {
      id: 'intellectual-property',
      number: '12',
      title: 'INTELLECTUAL PROPERTY',
      content: `12.1. DELIVA owns or holds the necessary licences and permissions to use the intellectual property associated with its Platform, brand, software, logos, designs, content, and related materials.
12.2. These materials are protected by applicable intellectual property laws.
12.3. Users are granted a limited, non-exclusive, non-transferable, and revocable right to access and use the Platform for its intended purposes.
12.4. Users must not reproduce, distribute, modify, sell, exploit, or commercially use DELIVA's intellectual property without prior written authorisation.
12.5. Nothing in these Terms transfers ownership of DELIVA's intellectual property to any User.
12.6. Users who believe that material available on the Platform infringes their intellectual property rights may contact DELIVA through its official support channels.`,
    },
    {
      id: 'limitation-of-liability',
      number: '13',
      title: 'LIMITATION OF LIABILITY',
      content: `13.1. DELIVA will exercise reasonable care in providing and coordinating its services.
13.2. DELIVA does not guarantee that the Platform will always be available, uninterrupted, or free from technical errors.
13.3. DELIVA will not be responsible for losses arising from inaccurate information supplied by Users, including incorrect pickup locations, delivery addresses, recipient details, or package descriptions, except where DELIVA is legally responsible for the relevant loss.
13.4. DELIVA is not responsible for the quality, authenticity, legality, or ownership of goods supplied by independent sellers or merchants.
13.5. Nothing in these Terms excludes or limits liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any other liability that cannot lawfully be excluded or limited under Nigerian law.
13.6. Any limitation of DELIVA's liability will apply only to the extent permitted by applicable law and will not remove rights that Users have under mandatory consumer protection laws.`,
    },
    {
      id: 'indemnification',
      number: '14',
      title: 'INDEMNIFICATION',
      content: `14.1. To the extent permitted by applicable law, Users agree to indemnify DELIVA against reasonable losses, liabilities, claims, and expenses arising directly from:
• Their breach of these Terms.
• Their fraudulent or unlawful use of the Platform.
• Their provision of false or misleading information.
• Their request to transport prohibited or unlawful goods.
• Their infringement of the rights of another person through their use of the Platform.
14.2. This provision does not apply to losses caused by DELIVA's own negligence, misconduct, breach of law, or other circumstances for which DELIVA is legally responsible.`,
    },
    {
      id: 'account-suspension-and-termination',
      number: '15',
      title: 'ACCOUNT SUSPENSION AND TERMINATION',
      content: `15.1. Users may stop using the Platform and request account closure through DELIVA's official support channels or available account settings.
15.2. DELIVA may restrict, suspend, or terminate a User's access to the Platform where:
• The User violates these Terms.
• The User engages in fraudulent or unlawful activity.
• The User provides false or misleading information.
• The User compromises the safety or security of the Platform.
• Continued access presents a material operational, legal, or security risk.
15.3. Where reasonably practicable and legally permissible, DELIVA will notify the affected User of the reason for suspension or termination.
15.4. Account closure does not automatically extinguish outstanding payment obligations or liabilities arising before termination.
15.5. Personal data associated with a closed account will be handled in accordance with DELIVA's Privacy Policy and applicable data protection and retention requirements.`,
    },
    {
      id: 'electronic-communication',
      number: '16',
      title: 'ELECTRONIC COMMUNICATION',
      content: `16.1. By using the Platform, Users consent to receiving service-related communications electronically.
16.2. These communications may include:
• Account registration and verification messages.
• Delivery confirmations.
• Delivery status notifications.
• Payment confirmations.
• Service updates.
• Security alerts.
• Changes to these Terms and applicable policies.
16.3. DELIVA may communicate through the Platform, email, SMS, telephone, or other contact details supplied by the User.
16.4. Users agree that electronic records, confirmations, and communications may be used as evidence of transactions and interactions, subject to applicable law.
16.5. Marketing communications will be handled in accordance with applicable consent and data protection requirements.
16.6. For safety, professionalism and proper coordination, Delivery Partners are not permitted to respond to customer or merchant phone calls, text messages, WhatsApp messages or other direct communications while actively riding or transporting a package.
16.7. Where a customer or merchant attempts to contact a Delivery Partner during transit, All communication, enquiries, complaints, delivery updates or special instructions during this period must be directed through the DELIVA Support Team.
This policy is intended to minimise distractions, improve rider safety, protect customer experience and ensure that delivery-related communication is properly documented and coordinated by DELIVA.`,
    },
    {
      id: 'personal-data-and-privacy',
      number: '17',
      title: 'PERSONAL DATA AND PRIVACY',
      content: `17.1. DELIVA collects and processes personal information necessary to provide, manage, secure, and improve its services.
17.2. Such information may include names, contact details, delivery addresses, transaction information, location information, and other information relevant to the use of the Platform.
17.3. Personal data may be shared with delivery partners, payment service providers, technology providers, and other authorised service providers where reasonably necessary to facilitate services or comply with legal obligations.
17.4. DELIVA will handle personal information in accordance with its Privacy Policy and applicable Nigerian data protection laws, including the Nigeria Data Protection Act 2023.
17.5. Users are encouraged to read DELIVA's Privacy Policy to understand how their information is collected, used, stored, shared, and protected.
17.6. Users may exercise applicable data protection rights through DELIVA's designated privacy contact.`,
    },
    {
      id: 'complaints-and-dispute-resolution',
      number: '18',
      title: 'COMPLAINTS AND DISPUTE RESOLUTION',
      content: `18.1. Users may submit complaints, concerns, or reports relating to deliveries, payments, account access, or other Platform activities through DELIVA's official customer support channels.
18.2. Complaints should include relevant information such as the delivery reference, date of transaction, description of the issue, and supporting evidence where available.
18.3. DELIVA will make reasonable efforts to review and resolve complaints within a reasonable period.
18.4. Where a complaint requires further investigation, DELIVA may request additional information from the relevant parties.
18.5. DELIVA encourages Users to first seek an amicable resolution through its customer support channels.
18.6. Nothing in this section prevents a User from exercising any legal rights or seeking remedies available under applicable Nigerian law.`,
    },
    {
      id: 'force-majeure',
      number: '19',
      title: 'FORCE MAJEURE',
      content: `19.1. DELIVA will not be considered in breach of these Terms where its ability to perform an obligation is prevented or materially affected by circumstances beyond its reasonable control.
19.2. Such circumstances may include natural disasters, severe weather, civil unrest, strikes, government restrictions, security emergencies, widespread network failures, or other events beyond reasonable control.
19.3. DELIVA will take reasonable steps to minimise the effects of such circumstances and communicate material service disruptions to affected Users where practicable.`,
    },
    {
      id: 'severability',
      number: '20',
      title: 'SEVERABILITY',
      content: `20.1. If any provision of these Terms is found to be invalid, unlawful, or unenforceable by a competent authority, that provision will be interpreted or modified to the extent necessary to make it enforceable, where legally possible.
20.2. If it cannot be made enforceable, the affected provision will be severed from these Terms without affecting the validity of the remaining provisions.`,
    },
    {
      id: 'governing-law',
      number: '21',
      title: 'GOVERNING LAW',
      content: `21.1. These Terms are governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria.
21.2. Any dispute arising from the interpretation, application, or enforcement of these Terms will be handled in accordance with applicable Nigerian law and by the courts of competent jurisdiction in Nigeria.`,
    },
    {
      id: 'contact-information',
      number: '22',
      title: 'CONTACT INFORMATION',
      content: `For questions, complaints, or requests relating to these Terms, Users may contact DELIVA through the following official channels:
Email: support@delivaglobe.com
Website: www.delivaglobe.com
Business Address: white house, ejionye ndubisi lodge by adawari hostel, omuokiri Aluu
Phone No: +2347015548163`,
    },
    {
      id: 'version-control',
      number: '23',
      title: 'VERSION CONTROL',
      content: `These Terms and Conditions were issued by Deliva Globe Ltd and may be updated from time to time.
Document Title: DELIVA Platform Terms and Conditions
Version: 1.0
Last Updated: November 2026.
©2026, Deliva Globe Ltd. All rights reserved.
DELIVA — Beyond delivery`,
    },
  ],
};

export const DEFAULT_PRIVACY_DOC: LegalDocumentData = {
  slug: 'privacy',
  title: 'DELIVA GLOBE LTD PRIVACY POLICY NOVEMBER 2026',
  documentTitle: 'DELIVA Platform Privacy Policy',
  version: '1.0',
  updated_at: '2026-11-07T22:30:00.000Z',
  introductionTitle: 'INTRODUCTION',
  introduction: `Deliva Globe Ltd ("DELIVA", "we", "us" or "our") operates a technology-enabled logistics platform that connects businesses and customers with delivery partners to facilitate reliable last-mile delivery services.
Our services enable users to request and manage deliveries, businesses to arrange deliveries for their customers, and delivery partners to receive and complete delivery requests through our platform.
At DELIVA, we recognise the importance of protecting the personal information entrusted to us. We are committed to transparency in how we collect, use, store, disclose and protect personal information belonging to individuals who interact with our services.
This Privacy Policy explains how we handle personal information relating to:
• Customers and individuals who request or receive deliveries ("Users").
• Businesses and merchants who use DELIVA to arrange deliveries ("Merchants").
• Individuals who register to provide delivery services through DELIVA ("Delivery Partners" or "Riders").
• Individuals who visit our website, contact our support team or otherwise interact with DELIVA.
For the purpose of this Policy, personal information or personal data means information relating to an identified or identifiable individual.
We encourage you to read this Privacy Policy together with our applicable Terms and Conditions and other relevant policies.
This Policy is intended to comply with applicable data protection laws in Nigeria, including the Nigeria Data Protection Act (NDPA) 2023 and any applicable regulations or guidance.
If you have questions about this Policy or how we handle your personal information, please contact us through the details provided at the end of this document.`,
  sections: [
    {
      id: 'changes-to-this-privacy-policy',
      number: '1',
      title: 'CHANGES TO THIS PRIVACY POLICY',
      content: `We may update this Privacy Policy from time to time to reflect changes in our services, technology, business operations, legal obligations or data protection practices.
Where changes are made, we will update the revised Policy on our website, mobile applications or other relevant communication channels.
Where a change materially affects your privacy rights or how we process your personal information, we will take reasonable steps to bring the change to your attention.
The updated Policy will take effect from the date stated in the revised version.
We encourage you to review this Policy periodically to remain informed about how DELIVA handles personal information.`,
    },
    {
      id: 'personal-information-we-collect',
      number: '2',
      title: 'PERSONAL INFORMATION WE COLLECT',
      content: `The information we collect depends on how you interact with DELIVA and which services you use.
We aim to collect only information that is reasonably necessary for providing our services, managing our operations, meeting legal obligations and improving the DELIVA platform.
### 2.1. Information Collected from Users and Customers
When you register, request a delivery or use DELIVA's services, we may collect:
• Full name.
• Phone number.
• Email address.
• Delivery and pickup addresses.
• Account login information.
• Delivery instructions.
• Recipient details provided for a delivery.
• Delivery request and transaction history.
• Payment confirmation and transaction references.
• Customer support communications and complaints.
• Relevant location information, where permitted.
### 2.2. Information Collected from Merchants
When a business registers or uses DELIVA to arrange deliveries, we may collect:
• Business name and contact details.
• Business address and operating location.
• Name and contact details of authorised representatives.
• Business registration information, where required.
• Account and login information.
• Pickup and delivery addresses.
• Delivery requests and transaction records.
• Payment and settlement information.
• Relevant business verification documents.
• Communications with DELIVA's support and operations teams.
Where a merchant provides personal information about its employees, customers or representatives, the merchant is responsible for ensuring that it has the necessary authority or lawful basis to provide that information to DELIVA.
### 2.3. Information Collected from Delivery Partners
Individuals applying to become DELIVA Delivery Partners may be required to provide information necessary for registration, identity verification, onboarding, delivery coordination and operational management.
This may include:
• Full name.
• Date of birth or age confirmation.
• Phone number and email address.
• Residential address.
• Government-issued identification.
• Passport photograph.
• Driver's licence, where applicable.
• Vehicle registration details.
• Vehicle type, make, model, colour and plate number.
• Proof of vehicle ownership or authorisation to use the vehicle.
• Next-of-kin information.
• Guarantor information and supporting documents, where required.
• Payment and settlement details.
• Delivery history and performance records.
• Training, onboarding and verification records.
• Reports, complaints or incident records relating to delivery activities.
We may also collect information relating to a rider's vehicle, delivery activity and compliance with DELIVA's operational and safety requirements.
### 2.4. Information Collected Through Communication
When you contact DELIVA through our support channels, email, telephone, mobile application or other approved communication channels, we may collect and retain relevant information from those interactions.
This may include:
• The content of messages and enquiries.
• Complaint details.
• Feedback and suggestions.
• Information provided during dispute resolution.
• Relevant attachments, photographs or supporting documents.
Where calls or communications are recorded, we will provide appropriate notice where required by law.
### 2.5. Information Collected Automatically
When you access or use our website, mobile applications or digital services, we may automatically collect certain technical information, including:
• Device type and operating system.
• Application version.
• IP address.
• Device identifiers.
• Browser type.
• Network and connection information.
• Application usage information.
• Login activity and timestamps.
• Error reports and diagnostic information.
We use this information to maintain the security, functionality and performance of our digital services.`,
    },
    {
      id: 'how-we-collect-personal-information',
      number: '3',
      title: 'HOW WE COLLECT PERSONAL INFORMATION',
      content: `We may collect personal information through different methods, including:
### 3.1. Directly from You
We collect information when you:
• Create or update an account.
• Register as a customer, merchant or delivery partner.
• Request or receive a delivery.
• Submit onboarding or verification documents.
• Make a payment through an approved payment channel.
• Contact our customer support team.
• Submit a complaint, review or feedback.
• Participate in a survey, promotion or research activity.
• Communicate with DELIVA through our website, applications, email or other channels.
### 3.2. Automatically Through Our Platform
We may collect technical, usage and location-related information through your interaction with the DELIVA website, mobile applications and services, subject to your device permissions and applicable law.
### 3.3. From Third Parties
Where lawful and necessary, we may receive relevant information from:
• Payment service providers.
• Identity verification providers.
• Business verification services.
• Fraud prevention and security providers.
• Merchants and business representatives.
• Delivery partners.
• Other service providers supporting our operations.
We will process personal information obtained from third parties in accordance with applicable data protection requirements.`,
    },
    {
      id: 'location-information',
      number: '4',
      title: 'LOCATION INFORMATION',
      content: `Location information is important to coordinating pickup and delivery services.
Depending on the service being used and the permissions granted on your device, DELIVA may collect location information through GPS, IP address or other available location technologies.
### 4.1. Users and Customers
We may use location information to:
• Identify or confirm pickup and delivery locations.
• Coordinate delivery requests.
• Provide relevant delivery updates.
• Support delivery tracking where available.
• Resolve delivery-related complaints.
• Improve delivery coordination and service efficiency.
### 4.2. Delivery Partners
We may collect a Delivery Partner's location during active delivery activities, subject to applicable permissions and legal requirements.
This information may be used to:
• Coordinate delivery assignments.
• Support pickup and delivery operations.
• Provide delivery progress updates where available.
• Assist with route coordination.
• Investigate delivery incidents.
• Improve operational efficiency and rider safety.
Location permissions may be managed through your device settings. However, disabling certain location permissions may affect your ability to use features that depend on location information.
DELIVA will not use location information for purposes unrelated to its services unless permitted by law or otherwise appropriately authorised.`,
    },
    {
      id: 'cookies-and-similar-technologies',
      number: '5',
      title: 'COOKIES AND SIMILAR TECHNOLOGIES',
      content: `Where our website or digital services use cookies or similar technologies, we may use them to:
• Improve website functionality.
• Remember certain user preferences.
• Understand how visitors interact with our website.
• Monitor website performance.
• Identify technical problems.
• Improve the relevance and usability of our services.
Cookies are small files stored on your device by a website. They may help a website recognise a returning visitor or remember certain preferences.
You may manage or disable cookies through your browser settings. However, disabling certain cookies may affect the functionality of some website features.
Where required by applicable law, we will provide appropriate information and obtain consent before using non-essential cookies or similar tracking technologies.`,
    },
    {
      id: 'how-we-use-your-personal-information',
      number: '6',
      title: 'HOW WE USE YOUR PERSONAL INFORMATION',
      content: `DELIVA may use personal information for the following purposes:
### 6.1. Providing Delivery Services
To:
• Create and manage user accounts.
• Receive and process delivery requests.
• Coordinate merchants, customers and delivery partners.
• Assign and manage delivery requests.
• Facilitate pickup and delivery activities.
• Provide delivery updates and notifications.
• Confirm successful or unsuccessful deliveries.
• Maintain delivery records.
### 6.2. Account Management and Verification
To:
• Verify user identities where necessary.
• Review merchant registration information.
• Verify delivery partner identities and documents.
• Manage account access.
• Prevent unauthorised account use.
• Maintain accurate account records.
### 6.3. Payment and Financial Administration
To:
• Facilitate payment for delivery services.
• Confirm payment transactions.
• Process eligible rider payments and settlements.
• Maintain transaction records.
• Investigate payment discrepancies.
• Meet financial, accounting and regulatory obligations.
DELIVA does not intend to collect or store full payment card details unless this is specifically required and appropriately secured. Where payments are processed through third-party payment providers, their applicable privacy and security policies may also apply.
### 6.4. Customer Support and Communication
To:
• Respond to enquiries.
• Provide delivery assistance.
• Resolve complaints and disputes.
• Communicate service updates.
• Investigate delivery-related incidents.
• Notify users of changes affecting their accounts or services.
### 6.5. Safety, Security and Fraud Prevention
To:
• Protect users, merchants and delivery partners.
• Detect and prevent fraudulent activities.
• Investigate suspicious transactions.
• Review reported incidents.
• Maintain platform security.
• Enforce our Terms and Conditions.
• Protect the integrity of our delivery network.
### 6.6. Service Improvement and Development
To:
• Understand how users interact with our platform.
• Identify technical and operational problems.
• Improve delivery coordination.
• Evaluate service performance.
• Develop new features and services.
• Conduct internal research and analysis.
• Improve the overall customer and delivery partner experience.
Where possible, we may use aggregated or de-identified information for analysis and service improvement.
### 6.7. Marketing and Promotional Communication
Where permitted by law and subject to applicable consent requirements, we may use your contact information to communicate information about DELIVA's services, updates, offers or promotions.
You may opt out of promotional communications at any time.
However, opting out of marketing messages will not prevent us from sending essential service communications, such as delivery updates, account notices, security alerts or payment confirmations.
### 6.8. Legal and Regulatory Compliance
We may process personal information where necessary to:
• Comply with applicable laws and regulations.
• Respond to lawful requests from regulatory or law enforcement authorities.
• Establish, exercise or defend legal claims.
• Maintain appropriate financial and operational records.
• Protect the rights, safety and property of DELIVA and other individuals.`,
    },
    {
      id: 'lawful-basis-for-processing',
      number: '7',
      title: 'LAWFUL BASIS FOR PROCESSING',
      content: `DELIVA processes personal information only where an appropriate lawful basis exists under applicable data protection laws.
Depending on the circumstances, these lawful bases may include:
### 7.1. Performance of a Contract
We may process personal information where necessary to provide services you have requested or to take steps at your request before entering into an agreement.
For example, we may use your name, phone number and delivery address to coordinate a delivery.
### 7.2. Consent
We may process certain personal information based on your consent, particularly where consent is required for specific activities such as certain marketing communications or optional data collection.
Where processing is based on consent, you may withdraw that consent at any time. Withdrawal does not affect the lawfulness of processing carried out before withdrawal.
### 7.3. Legal Obligations
We may process personal information where necessary to comply with applicable legal or regulatory requirements.
### 7.4. Legitimate Interests
We may process personal information where necessary for legitimate business purposes, provided those interests do not override your rights and freedoms.
These purposes may include fraud prevention, platform security, service improvement, operational management and dispute resolution.
### 7.5. Vital Interests and Other Lawful Grounds
In limited circumstances, we may process personal information where necessary to protect someone's vital interests or where another lawful basis recognised by applicable data protection law applies.`,
    },
    {
      id: 'sharing-and-disclosure-of-personal-information',
      number: '8',
      title: 'SHARING AND DISCLOSURE OF PERSONAL INFORMATION',
      content: `DELIVA does not sell personal information to third parties.
However, we may share relevant personal information where necessary to provide our services, operate our business, meet legal obligations or protect the rights and safety of individuals.
Information may be shared with the following categories of recipients:
### 8.1. Delivery Partners
We may share relevant delivery information with assigned Delivery Partners, including:
• Customer or recipient name.
• Pickup and delivery addresses.
• Contact details necessary for completing the delivery.
• Delivery instructions.
• Relevant package or delivery information.
This information is shared to enable the assigned rider to complete the delivery.
### 8.2. Users and Merchants
We may share relevant delivery information between customers and merchants to facilitate delivery coordination, order fulfilment and issue resolution.
Only information reasonably necessary for the relevant service should be shared.
### 8.3. Payment Service Providers
We may share relevant transaction information with payment service providers to process payments, confirm transactions, manage settlements and investigate payment-related issues.
### 8.4. Technology and Operational Service Providers
We may share information with trusted service providers who support our operations, including:
• Cloud hosting and storage providers.
• Software and technology providers.
• Communication and notification providers.
• Identity verification providers.
• Analytics and security providers.
• Customer support service providers.
Such providers should only process personal information in accordance with applicable agreements, authorised instructions and relevant data protection requirements.
### 8.5. Professional Advisers
Where necessary, we may share information with professional advisers, including legal practitioners, auditors, accountants and financial advisers, subject to appropriate confidentiality obligations.
### 8.6. Government and Regulatory Authorities
We may disclose personal information to courts, law enforcement agencies, regulators or other public authorities where required or permitted by applicable law.
### 8.7. Business Transactions
If DELIVA undergoes a merger, acquisition, restructuring, financing or transfer of business assets, relevant personal information may be disclosed as part of that process, subject to applicable data protection requirements.
Where necessary, we will take reasonable steps to ensure that any recipient handles the information appropriately.`,
    },
    {
      id: 'third-party-services-and-links',
      number: '9',
      title: 'THIRD-PARTY SERVICES AND LINKS',
      content: `Our website, mobile applications or other digital services may contain links to third-party websites, applications or services.
We may also rely on third-party providers to support payment processing, identity verification, hosting, communications, analytics and other operational functions.
These third parties may have their own privacy policies and data protection practices.
DELIVA is not responsible for the independent privacy practices of third-party websites or services that it does not control.
We encourage you to review the relevant privacy policies before providing personal information directly to third-party services.
Where a third-party service processes personal information on DELIVA's behalf, we will take reasonable steps to ensure that appropriate contractual and data protection safeguards are in place.`,
    },
    {
      id: 'communications-and-customer-support',
      number: '10',
      title: 'COMMUNICATIONS AND CUSTOMER SUPPORT',
      content: `DELIVA may communicate with you through the contact information associated with your account or provided during your interaction with our services.
These communications may include:
• Account registration and verification messages.
• Delivery confirmations and updates.
• Pickup and delivery notifications.
• Payment confirmations.
• Service announcements.
• Customer support responses.
• Security notifications.
• Relevant operational instructions.
Communications may take place through the DELIVA platform, telephone, email, SMS, WhatsApp or other approved channels.
Where communications are recorded or retained, the information may be used for customer support, quality assurance, fraud prevention, operational monitoring and dispute resolution, in accordance with applicable law.
### Communication During Delivery Transit
For safety and proper coordination, DELIVA may require Delivery Partners not to respond to customer or merchant calls and messages while actively riding or transporting packages.
During this period, delivery-related enquiries, complaints, instructions and requests for assistance should be directed through the DELIVA Support Team.
Relevant communications between users, riders and the support team may be retained where necessary to coordinate deliveries, resolve complaints and maintain accurate operational records.`,
    },
    {
      id: 'surveys-feedback-and-research',
      number: '11',
      title: 'SURVEYS, FEEDBACK AND RESEARCH',
      content: `DELIVA may invite users, merchants and delivery partners to participate in optional surveys, interviews or research activities to help us understand their experiences and improve our services.
Where you voluntarily participate, we may collect the information you provide, including feedback, opinions and relevant service experiences.
We will inform you where additional personal information is requested for a research activity and obtain consent where required.
Participation in optional surveys or research activities is voluntary and will not ordinarily affect your ability to use DELIVA's services.`,
    },
    {
      id: 'data-security',
      number: '12',
      title: 'DATA SECURITY',
      content: `DELIVA takes reasonable technical and organisational measures to protect personal information against:
• Unauthorised access.
• Loss or destruction.
• Unauthorised disclosure.
• Alteration or misuse.
• Unlawful processing.
• Other forms of security compromise.
Depending on the nature of the information and the risks involved, our security measures may include access controls, authentication procedures, encryption, secure system configurations, staff confidentiality requirements and monitoring of relevant systems.
We also take reasonable steps to limit access to personal information to individuals and service providers who need it for authorised business purposes.
However, no digital platform, internet transmission or storage system can be guaranteed to be completely secure.
You are responsible for keeping your account credentials confidential and notifying DELIVA promptly if you suspect unauthorised access to your account.
Where a personal data breach occurs, DELIVA will take appropriate steps to investigate, contain and address the incident and make any notifications required by applicable law.`,
    },
    {
      id: 'international-data-transfers',
      number: '13',
      title: 'INTERNATIONAL DATA TRANSFERS',
      content: `Some of the technology or service providers supporting DELIVA may process or store personal information outside Nigeria.
Where personal information is transferred outside Nigeria, DELIVA will take reasonable steps to ensure that the transfer complies with applicable data protection laws.
This may include assessing the destination country's data protection framework and implementing appropriate safeguards or other lawful transfer mechanisms where required.
We will not knowingly transfer personal information internationally without an appropriate lawful basis and required safeguards.`,
    },
    {
      id: 'retention-of-personal-information',
      number: '14',
      title: 'RETENTION OF PERSONAL INFORMATION',
      content: `DELIVA will retain personal information only for as long as reasonably necessary for the purposes for which it was collected, including the provision of services, operational management, dispute resolution, fraud prevention and compliance with legal obligations.
Retention periods may vary depending on:
• The type of personal information.
• The nature of the service provided.
• The status of the user's account.
• Financial and accounting requirements.
• Legal and regulatory obligations.
• Outstanding complaints, investigations or disputes.
• Legitimate business and security needs.
For example, delivery and transaction records may need to be retained for a period required by applicable financial, tax or other laws.
Where personal information is no longer required, DELIVA will take reasonable steps to securely delete, anonymise or de-identify it, subject to any legal obligation to retain the information.`,
    },
    {
      id: 'your-data-protection-rights',
      number: '15',
      title: 'YOUR DATA PROTECTION RIGHTS',
      content: `Subject to applicable law and relevant exceptions, you may have the right to:
### 15.1. Right to Be Informed
You have the right to receive information about how DELIVA collects and processes your personal information.
### 15.2. Right of Access
You may request confirmation of whether DELIVA holds personal information about you and request access to that information.
### 15.3. Right to Rectification
You may request that inaccurate, incomplete or outdated personal information be corrected or updated.
### 15.4. Right to Erasure
You may request the deletion of your personal information where the law permits.
However, DELIVA may retain certain information where it is required to comply with legal obligations, resolve disputes, prevent fraud or protect legitimate business interests.
### 15.5. Right to Restrict Processing
You may request that DELIVA restrict the processing of your personal information in circumstances recognised by applicable law.
### 15.6. Right to Object
You may object to certain forms of processing, including processing based on legitimate interests or processing for direct marketing, subject to applicable legal provisions.
### 15.7. Right to Data Portability
Where applicable, you may request that certain personal information be provided to you or transferred to another organisation in a structured, commonly used and machine-readable format.
### 15.8. Right to Withdraw Consent
Where DELIVA relies on your consent to process personal information, you may withdraw that consent at any time.
### 15.9. Right to Lodge a Complaint
You may lodge a complaint with the Nigeria Data Protection Commission or another relevant supervisory authority where you believe your personal information has been processed unlawfully.
To exercise any of these rights, contact DELIVA using the details provided in this Policy.
We may request information necessary to verify your identity before responding to a request.`,
    },
    {
      id: 'account-deactivation-and-deletion-requests',
      number: '16',
      title: 'ACCOUNT DEACTIVATION AND DELETION REQUESTS',
      content: `Users, merchants and delivery partners may request account deactivation or deletion through DELIVA's approved support channels, subject to applicable platform procedures.
Deactivating an account does not automatically mean that all associated personal information will be immediately deleted.
DELIVA may retain certain information where necessary to:
• Meet legal or regulatory obligations.
• Maintain financial and transaction records.
• Resolve outstanding complaints or disputes.
• Investigate suspected fraud or misconduct.
• Protect the security and integrity of the platform.
• Establish, exercise or defend legal claims.
Where information is no longer required for these purposes, DELIVA will take reasonable steps to delete or anonymise it in accordance with its retention practices and applicable law.`,
    },
    {
      id: 'childrens-privacy',
      number: '17',
      title: "CHILDREN'S PRIVACY",
      content: `DELIVA's services are not intended for individuals who do not meet the minimum age requirements applicable to the relevant service.
We do not knowingly collect personal information directly from children in violation of applicable data protection laws.
Where we become aware that personal information has been collected from a child unlawfully or without the required authorisation, we will take appropriate steps to address the situation.`,
    },
    {
      id: 'privacy-responsibilities',
      number: '18',
      title: 'PRIVACY RESPONSIBILITIES OF USERS, MERCHANTS AND DELIVERY PARTNERS',
      content: `Everyone who uses DELIVA has a responsibility to handle personal information appropriately.
### 18.1. Users and Customers
You should provide accurate information and avoid sharing another person's personal information unless you have the necessary authority or lawful basis to do so.
### 18.2. Merchants
Merchants must ensure that personal information provided to DELIVA, including recipient names, telephone numbers and delivery addresses, is collected and shared lawfully.
Merchants must not use DELIVA to disclose or process personal information for unauthorised purposes.
### 18.3. Delivery Partners
Delivery Partners may receive access to customer and merchant information to complete assigned deliveries.
They must:
• Use customer and merchant information only for authorised delivery purposes.
• Keep personal information confidential.
• Avoid sharing customer or merchant details with unauthorised persons.
• Not use delivery information for personal solicitation or private transactions.
• Not retain or misuse customer contact information after the delivery.
• Follow DELIVA's communication, safety and operational policies.
Any suspected misuse or unauthorised disclosure of personal information should be reported to DELIVA promptly.`,
    },
    {
      id: 'direct-marketing',
      number: '19',
      title: 'DIRECT MARKETING',
      content: `DELIVA may send promotional information about its services, offers, updates and relevant activities where permitted by applicable law.
Where consent is required, we will obtain it before sending promotional communications.
You may opt out of marketing communications through the available unsubscribe option or by contacting our support team.
Please note that opting out of marketing communications will not prevent DELIVA from sending essential service-related messages, including delivery updates, account notifications, security alerts and payment information.`,
    },
    {
      id: 'data-protection-contact',
      number: '20',
      title: 'DATA PROTECTION CONTACT',
      content: `DELIVA is committed to handling personal information responsibly and addressing privacy concerns.
For questions, complaints, access requests, correction requests, deletion requests or other data protection enquiries, you may contact us through:
Company: Deliva Globe Ltd
Privacy Contact Email: privacy@delivaglobe.com
Support Email: support@delivaglobe.com
Phone Number: +2347015548163
Registered Business Address: White house, Ejionye Ndubisi lodge by Adawari hostel, Omuokiri, Aluu.
We will review privacy requests and respond within the timeframes required by applicable law.`,
    },
    {
      id: 'governing-law',
      number: '21',
      title: 'GOVERNING LAW',
      content: `This Privacy Policy shall be governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act 2023 and other applicable data protection laws and regulations.
Where any provision of this Policy conflicts with a mandatory legal requirement, the applicable law shall prevail.`,
    },
    {
      id: 'final-note',
      number: '22',
      title: 'FINAL NOTE',
      content: `At DELIVA, we understand that reliable logistics depends not only on moving packages but also on maintaining the trust of the people and businesses that use our platform.
We are committed to handling personal information responsibly, protecting the privacy of our users, merchants and delivery partners, and continually improving our data protection practices.
DELIVA GLOBE LTD Beyond Delivery
@2026, All right reserved`,
    },
  ],
};

export const DEFAULT_LEGAL_DOCS: Record<'terms' | 'privacy', LegalDocumentData> = {
  terms: DEFAULT_TERMS_DOC,
  privacy: DEFAULT_PRIVACY_DOC,
};

