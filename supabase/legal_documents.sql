-- ============================================================================
-- DELIVA WAITLIST 2: Legal Documents Table (Terms & Conditions + Privacy Policy)
-- Stores editable legal documents with automatic `updated_at` timestamp tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.legal_documents (
  slug TEXT PRIMARY KEY CHECK (slug IN ('terms', 'privacy')),
  title TEXT NOT NULL,
  document_title TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '1.0',
  introduction_title TEXT NOT NULL DEFAULT 'INTRODUCTION',
  introduction TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automatically update `updated_at` whenever a document is edited
CREATE OR REPLACE FUNCTION public.handle_legal_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_legal_documents_updated_at ON public.legal_documents;
CREATE TRIGGER trg_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_legal_documents_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to legal_documents" ON public.legal_documents;
CREATE POLICY "Allow public read access to legal_documents"
  ON public.legal_documents
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to update legal_documents" ON public.legal_documents;
CREATE POLICY "Allow authenticated users to update legal_documents"
  ON public.legal_documents
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Realtime updates for `legal_documents`
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.legal_documents;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SEED: Terms and Conditions ('terms')
-- ============================================================================
INSERT INTO public.legal_documents (
  slug,
  title,
  document_title,
  version,
  introduction_title,
  introduction,
  sections,
  updated_at
)
VALUES (
  'terms',
  'DELIVA GLOBE LTD TERMS AND CONDITIONS OF USE',
  'DELIVA Platform Terms and Conditions',
  '1.0',
  'INTRODUCTION',
  $intro$Welcome to DELIVA.
DELIVA is a technology-enabled last-mile logistics platform operated by Deliva Globe Ltd ("DELIVA", "we", "us", or "our").
Our platform connects businesses and individuals requiring delivery services with delivery partners who facilitate the movement of goods from designated pickup locations to specified delivery destinations.
These Terms and Conditions ("Terms") govern your access to and use of the DELIVA website, mobile applications, and associated services (collectively referred to as the "Platform").
By accessing, registering on, or using our Platform, you ("User", "you", or "your") acknowledge that you have read, understood, and agreed to be bound by these Terms and our applicable Privacy Policy.
Please read these Terms carefully before using our Platform.
If you do not agree with any part of these Terms, you should discontinue your use of the Platform.
For questions or clarification regarding these Terms, please contact us through our official customer support channels. support@delivaglobe.com.$intro$,
  $json$[
    {
      "id": "general-terms",
      "number": "1",
      "title": "GENERAL TERMS",
      "content": "1.1. These Terms govern the use of DELIVA's website, mobile applications, and associated delivery services.\n1.2. These Terms apply to all individuals and entities accessing or using the Platform, including registered users, customers, and businesses requesting delivery services, except where separate agreements apply.\n1.3. By accessing or using the Platform, you confirm that you accept these Terms and agree to comply with all applicable provisions.\n1.4. DELIVA reserves the right to amend, update, or modify these Terms when necessary to reflect changes in our services, business operations, legal requirements, or Platform features.\n1.5. Where material changes are made, DELIVA will take reasonable steps to notify affected Users through the Platform or other appropriate communication channels.\n1.6. Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms, subject to applicable law.\n1.7. A violation of these Terms may result in restrictions, suspension, or termination of access to the Platform or relevant services."
    },
    {
      "id": "description-of-services",
      "number": "2",
      "title": "DESCRIPTION OF SERVICES",
      "content": "2.1. DELIVA provides technology-enabled last-mile delivery coordination services through its Platform.\n2.2. The Platform enables Users to request, arrange, monitor, and manage the delivery of eligible goods between designated pickup and delivery locations.\n2.3. DELIVA's services may include:\n• Creation and management of delivery requests.\n• Coordination and assignment of delivery partners.\n• Collection of packages from designated pickup locations.\n• Transportation and delivery of packages to specified destinations.\n• Delivery status updates and tracking.\n• Proof of delivery and delivery confirmation.\n• Customer support and delivery-related assistance.\n2.4. The availability of specific services and Platform features may vary depending on location, operational capacity, and the features made available by DELIVA from time to time.\n2.5. DELIVA primarily facilitates the delivery of goods belonging to businesses, merchants, and individuals. DELIVA does not ordinarily own, manufacture, or sell the goods being transported.\n2.6. Unless expressly agreed otherwise in writing, the sale, description, quality, authenticity, ownership, and suitability of goods remain the responsibility of the relevant seller or merchant.\n2.7. DELIVA may establish separate agreements, policies, and operating requirements for merchants and delivery partners. Where applicable, those additional terms will apply alongside these Terms."
    },
    {
      "id": "accessing-the-platform",
      "number": "3",
      "title": "ACCESSING THE PLATFORM",
      "content": "3.1. DELIVA does not guarantee that the Platform or its services will always be available, uninterrupted, secure, or free from technical errors.\n3.2. DELIVA may temporarily suspend access to the Platform to carry out maintenance, upgrades, security reviews, or other operational activities.\n3.3. DELIVA may introduce, modify, restrict, or discontinue certain Platform features where reasonably necessary.\n3.4. Users are responsible for obtaining and maintaining the devices, internet access, and other resources necessary to use the Platform.\n3.5. Users must ensure that their use of the Platform complies with these Terms and all applicable laws and regulations."
    },
    {
      "id": "user-eligibility-and-registration",
      "number": "4",
      "title": "USER ELIGIBILITY AND REGISTRATION",
      "content": "4.1. Users must be at least eighteen (16) years old and legally capable of entering into binding agreements under applicable Nigerian law.\n4.2. To access certain services, Users may be required to create an account by providing information requested by DELIVA.\n4.3. Registration information may include:\n• Full name.\n• Valid email address.\n• Active telephone number.\n• Delivery or business address, where applicable.\n• Other information reasonably required to provide or verify the services.\n4.4. Users agree that all information submitted during registration or subsequent account updates must be accurate, complete, and current.\n4.5. Users are responsible for updating their account information whenever relevant details change.\n4.6. DELIVA may request additional information or documentation where necessary to verify a User's identity, prevent fraud, protect the Platform, or comply with applicable legal requirements.\n4.7. Users are responsible for maintaining the confidentiality of their account credentials and must not share their login details with unauthorised persons.\n4.8. Users are responsible for activities carried out through their accounts, except where unauthorised activity results from circumstances for which DELIVA is legally responsible.\n4.9. If a User suspects that their account has been compromised, accessed without permission, or used fraudulently, they must notify DELIVA immediately.\n4.10. DELIVA reserves the right to restrict, suspend, or deactivate accounts where there is reasonable suspicion of fraudulent activity, security breaches, false information, or violations of these Terms."
    },
    {
      "id": "delivery-requests-and-order-management",
      "number": "5",
      "title": "DELIVERY REQUESTS AND ORDER MANAGEMENT",
      "content": "5.1. Users may submit delivery requests through the Platform by providing the information required to facilitate the requested delivery.\n5.2. A delivery request may require:\n• Pickup location.\n• Delivery destination.\n• Recipient's name and contact details.\n• Description of the package.\n• Package size, weight, or other relevant specifications.\n• Special handling instructions, where applicable.\n5.3. Users are responsible for ensuring that all delivery information submitted is accurate and complete.\n5.4. DELIVA may review delivery requests and determine whether they can be accepted based on service availability, operational capacity, location, package specifications, and applicable restrictions.\n5.5. Submission of a delivery request does not automatically guarantee acceptance or fulfilment.\n5.6. A delivery request will be considered accepted when confirmation is communicated through the Platform or another official DELIVA communication channel.\n5.7. DELIVA reserves the right to decline, cancel, or suspend a delivery request where:\n• The requested delivery is outside our service coverage.\n• The package contains prohibited or restricted items.\n• The delivery information is incomplete or inaccurate.\n• The package does not meet our operational or safety requirements.\n• The requested delivery cannot reasonably be completed.\n• There are reasonable grounds to suspect fraud or unlawful activity."
    },
    {
      "id": "delivery-fees-and-payment",
      "number": "6",
      "title": "DELIVERY FEES AND PAYMENT",
      "content": "6.1. Delivery fees and other applicable charges will be communicated to Users before confirmation of a delivery request.\n6.2. Delivery fees may vary depending on factors such as:\n• Distance between pickup and delivery locations.\n• Package size and weight.\n• Delivery location.\n• Service type.\n• Other relevant operational considerations.\n6.3. Users agree to pay the applicable fees communicated at the point of booking, unless a different payment arrangement has been expressly agreed with DELIVA.\n6.4. Payments made through the Platform may be processed by authorised third-party payment service providers.\n6.5. Users acknowledge that third-party payment providers may have separate terms and conditions governing their payment services.\n6.6. DELIVA will not knowingly charge Users for services or amounts that were not disclosed or otherwise agreed to, except where additional charges arise under an applicable policy or agreement.\n6.7. DELIVA reserves the right to revise its delivery fees and pricing structure from time to time. Any applicable revised charges will be communicated before the User confirms a new delivery request.\n6.8. Where a payment is unsuccessful, incomplete, reversed, or disputed, DELIVA may suspend the relevant delivery request while the payment issue is investigated."
    },
    {
      "id": "delivery-responsibilities",
      "number": "7",
      "title": "DELIVERY RESPONSIBILITIES",
      "content": "7.1. Users agree to provide accurate pickup and delivery information and ensure that packages are properly prepared for collection.\n7.2. Users must ensure that the package is appropriately packaged, secured, and suitable for transportation.\n7.3. Users are responsible for accurately describing the contents of packages and disclosing any special handling requirements.\n7.4. DELIVA will coordinate delivery activities through its delivery network and applicable operational procedures.\n7.5. Delivery partners are expected to handle packages responsibly and follow the applicable delivery procedures communicated by DELIVA.\n7.6. Recipients must make reasonable arrangements to receive deliveries at the designated destination.\n7.7. Users are responsible for ensuring that the recipient's contact information and delivery address are correct.\n7.8. DELIVA may provide delivery status updates and proof of delivery through available Platform features.\n7.9. Delivery timelines provided through the Platform are estimates unless expressly confirmed as guaranteed delivery commitments.\n7.10. DELIVA will make reasonable efforts to facilitate deliveries within communicated timelines but does not guarantee that every delivery will be completed within a particular period."
    },
    {
      "id": "failed-delayed-or-unsuccessful-deliveries",
      "number": "8",
      "title": "FAILED, DELAYED, OR UNSUCCESSFUL DELIVERIES",
      "content": "8.1. A delivery may be delayed or unsuccessful due to circumstances including:\n• Incorrect pickup or delivery information.\n• Recipient unavailability.\n• Inability to access the delivery location.\n• Traffic congestion or road conditions.\n• Severe weather or other environmental conditions.\n• Vehicle breakdowns or operational disruptions.\n• Security incidents.\n• Other circumstances beyond reasonable operational control.\n8.2. Where a delivery cannot be completed, DELIVA will take reasonable steps to communicate the issue to the relevant User and determine an appropriate next step.\n8.3. Depending on the circumstances, this may include arranging another delivery attempt, returning the package to the pickup location, or agreeing on another reasonable arrangement.\n8.4. Additional charges may apply where a failed delivery or additional delivery attempt results from inaccurate information, recipient unavailability, or other circumstances attributable to the User. Any applicable charges must be communicated before they are imposed.\n8.5. DELIVA may investigate reported delivery failures and take appropriate corrective action in accordance with its operational procedures."
    },
    {
      "id": "cancellations-and-refunds",
      "number": "9",
      "title": "CANCELLATIONS AND REFUNDS",
      "content": "9.1. Users may request the cancellation of a delivery through the Platform or official DELIVA support channels.\n9.2. Whether a cancellation can be accepted may depend on the stage of the delivery process.\n9.3. A cancellation request made before a delivery partner has been assigned or the package collected may be handled differently from a request made after collection or while the package is in transit.\n9.4. Where a cancellation request is received after a delivery has commenced, DELIVA may assess any costs already incurred and communicate any applicable charges before processing the cancellation.\n9.5. Refunds may be considered where:\n• A User has paid for a delivery that DELIVA is unable to provide.\n• A payment has been duplicated or incorrectly processed.\n• A delivery is cancelled under circumstances that qualify for a refund.\n• Another circumstance recognised under DELIVA's applicable refund policy arises.\n9.6. Refund requests will be reviewed based on the circumstances of the transaction and relevant payment records.\n9.7. Where a refund is approved, it will be processed through the original payment channel or another appropriate method communicated by DELIVA.\n9.8. Refund processing times may depend on the relevant payment service provider and financial institution.\n9.9. DELIVA will not deny a refund where applicable Nigerian law requires one."
    },
    {
      "id": "prohibited-and-restricted-items",
      "number": "10",
      "title": "PROHIBITED AND RESTRICTED ITEMS",
      "content": "10.1. Users must not request the transportation of goods that are illegal, dangerous, prohibited, or restricted under applicable Nigerian law or DELIVA's operating policies.\n10.2. Prohibited items may include:\n• Illegal drugs and controlled substances.\n• Firearms, ammunition, and explosives.\n• Hazardous chemicals and dangerous materials.\n• Stolen or unlawfully obtained goods.\n• Counterfeit goods.\n• Items prohibited by applicable law.\n• Any other goods that DELIVA reasonably determines cannot be safely or lawfully transported.\n10.3. DELIVA reserves the right to reject delivery requests involving prohibited or restricted goods.\n10.4. Users must not conceal the contents of packages or provide misleading descriptions intended to bypass DELIVA's restrictions.\n10.5. Where a User submits a delivery request involving prohibited goods, DELIVA may suspend the delivery, restrict the relevant account, and report suspected unlawful activity to the appropriate authorities where required or permitted by law."
    },
    {
      "id": "user-conduct-and-restricted-activities",
      "number": "11",
      "title": "USER CONDUCT AND RESTRICTED ACTIVITIES",
      "content": "11.1. Users agree to use the Platform only for lawful purposes and in accordance with these Terms.\n11.2. Users must not:\n• Provide false or misleading information.\n• Use the Platform to facilitate fraudulent or unlawful activities.\n• Harass, threaten, abuse, or intimidate delivery partners, other Users, or DELIVA personnel.\n• Interfere with the proper functioning or security of the Platform.\n• Attempt to gain unauthorised access to another User's account.\n• Manipulate delivery requests, payments, or Platform records.\n• Upload malicious software or harmful content.\n• Reverse engineer, copy, modify, or exploit DELIVA's software without authorisation.\n• Use the Platform in a manner that compromises the safety of other Users or delivery partners.\n11.3. DELIVA reserves the right to investigate suspected violations and take appropriate action in accordance with these Terms and applicable law."
    },
    {
      "id": "intellectual-property",
      "number": "12",
      "title": "INTELLECTUAL PROPERTY",
      "content": "12.1. DELIVA owns or holds the necessary licences and permissions to use the intellectual property associated with its Platform, brand, software, logos, designs, content, and related materials.\n12.2. These materials are protected by applicable intellectual property laws.\n12.3. Users are granted a limited, non-exclusive, non-transferable, and revocable right to access and use the Platform for its intended purposes.\n12.4. Users must not reproduce, distribute, modify, sell, exploit, or commercially use DELIVA's intellectual property without prior written authorisation.\n12.5. Nothing in these Terms transfers ownership of DELIVA's intellectual property to any User.\n12.6. Users who believe that material available on the Platform infringes their intellectual property rights may contact DELIVA through its official support channels."
    },
    {
      "id": "limitation-of-liability",
      "number": "13",
      "title": "LIMITATION OF LIABILITY",
      "content": "13.1. DELIVA will exercise reasonable care in providing and coordinating its services.\n13.2. DELIVA does not guarantee that the Platform will always be available, uninterrupted, or free from technical errors.\n13.3. DELIVA will not be responsible for losses arising from inaccurate information supplied by Users, including incorrect pickup locations, delivery addresses, recipient details, or package descriptions, except where DELIVA is legally responsible for the relevant loss.\n13.4. DELIVA is not responsible for the quality, authenticity, legality, or ownership of goods supplied by independent sellers or merchants.\n13.5. Nothing in these Terms excludes or limits liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any other liability that cannot lawfully be excluded or limited under Nigerian law.\n13.6. Any limitation of DELIVA's liability will apply only to the extent permitted by applicable law and will not remove rights that Users have under mandatory consumer protection laws."
    },
    {
      "id": "indemnification",
      "number": "14",
      "title": "INDEMNIFICATION",
      "content": "14.1. To the extent permitted by applicable law, Users agree to indemnify DELIVA against reasonable losses, liabilities, claims, and expenses arising directly from:\n• Their breach of these Terms.\n• Their fraudulent or unlawful use of the Platform.\n• Their provision of false or misleading information.\n• Their request to transport prohibited or unlawful goods.\n• Their infringement of the rights of another person through their use of the Platform.\n14.2. This provision does not apply to losses caused by DELIVA's own negligence, misconduct, breach of law, or other circumstances for which DELIVA is legally responsible."
    },
    {
      "id": "account-suspension-and-termination",
      "number": "15",
      "title": "ACCOUNT SUSPENSION AND TERMINATION",
      "content": "15.1. Users may stop using the Platform and request account closure through DELIVA's official support channels or available account settings.\n15.2. DELIVA may restrict, suspend, or terminate a User's access to the Platform where:\n• The User violates these Terms.\n• The User engages in fraudulent or unlawful activity.\n• The User provides false or misleading information.\n• The User compromises the safety or security of the Platform.\n• Continued access presents a material operational, legal, or security risk.\n15.3. Where reasonably practicable and legally permissible, DELIVA will notify the affected User of the reason for suspension or termination.\n15.4. Account closure does not automatically extinguish outstanding payment obligations or liabilities arising before termination.\n15.5. Personal data associated with a closed account will be handled in accordance with DELIVA's Privacy Policy and applicable data protection and retention requirements."
    },
    {
      "id": "electronic-communication",
      "number": "16",
      "title": "ELECTRONIC COMMUNICATION",
      "content": "16.1. By using the Platform, Users consent to receiving service-related communications electronically.\n16.2. These communications may include:\n• Account registration and verification messages.\n• Delivery confirmations.\n• Delivery status notifications.\n• Payment confirmations.\n• Service updates.\n• Security alerts.\n• Changes to these Terms and applicable policies.\n16.3. DELIVA may communicate through the Platform, email, SMS, telephone, or other contact details supplied by the User.\n16.4. Users agree that electronic records, confirmations, and communications may be used as evidence of transactions and interactions, subject to applicable law.\n16.5. Marketing communications will be handled in accordance with applicable consent and data protection requirements.\n16.6. For safety, professionalism and proper coordination, Delivery Partners are not permitted to respond to customer or merchant phone calls, text messages, WhatsApp messages or other direct communications while actively riding or transporting a package.\n16.7. Where a customer or merchant attempts to contact a Delivery Partner during transit, All communication, enquiries, complaints, delivery updates or special instructions during this period must be directed through the DELIVA Support Team.\nThis policy is intended to minimise distractions, improve rider safety, protect customer experience and ensure that delivery-related communication is properly documented and coordinated by DELIVA."
    },
    {
      "id": "personal-data-and-privacy",
      "number": "17",
      "title": "PERSONAL DATA AND PRIVACY",
      "content": "17.1. DELIVA collects and processes personal information necessary to provide, manage, secure, and improve its services.\n17.2. Such information may include names, contact details, delivery addresses, transaction information, location information, and other information relevant to the use of the Platform.\n17.3. Personal data may be shared with delivery partners, payment service providers, technology providers, and other authorised service providers where reasonably necessary to facilitate services or comply with legal obligations.\n17.4. DELIVA will handle personal information in accordance with its Privacy Policy and applicable Nigerian data protection laws, including the Nigeria Data Protection Act 2023.\n17.5. Users are encouraged to read DELIVA's Privacy Policy to understand how their information is collected, used, stored, shared, and protected.\n17.6. Users may exercise applicable data protection rights through DELIVA's designated privacy contact."
    },
    {
      "id": "complaints-and-dispute-resolution",
      "number": "18",
      "title": "COMPLAINTS AND DISPUTE RESOLUTION",
      "content": "18.1. Users may submit complaints, concerns, or reports relating to deliveries, payments, account access, or other Platform activities through DELIVA's official customer support channels.\n18.2. Complaints should include relevant information such as the delivery reference, date of transaction, description of the issue, and supporting evidence where available.\n18.3. DELIVA will make reasonable efforts to review and resolve complaints within a reasonable period.\n18.4. Where a complaint requires further investigation, DELIVA may request additional information from the relevant parties.\n18.5. DELIVA encourages Users to first seek an amicable resolution through its customer support channels.\n18.6. Nothing in this section prevents a User from exercising any legal rights or seeking remedies available under applicable Nigerian law."
    },
    {
      "id": "force-majeure",
      "number": "19",
      "title": "FORCE MAJEURE",
      "content": "19.1. DELIVA will not be considered in breach of these Terms where its ability to perform an obligation is prevented or materially affected by circumstances beyond its reasonable control.\n19.2. Such circumstances may include natural disasters, severe weather, civil unrest, strikes, government restrictions, security emergencies, widespread network failures, or other events beyond reasonable control.\n19.3. DELIVA will take reasonable steps to minimise the effects of such circumstances and communicate material service disruptions to affected Users where practicable."
    },
    {
      "id": "severability",
      "number": "20",
      "title": "SEVERABILITY",
      "content": "20.1. If any provision of these Terms is found to be invalid, unlawful, or unenforceable by a competent authority, that provision will be interpreted or modified to the extent necessary to make it enforceable, where legally possible.\n20.2. If it cannot be made enforceable, the affected provision will be severed from these Terms without affecting the validity of the remaining provisions."
    },
    {
      "id": "governing-law",
      "number": "21",
      "title": "GOVERNING LAW",
      "content": "21.1. These Terms are governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria.\n21.2. Any dispute arising from the interpretation, application, or enforcement of these Terms will be handled in accordance with applicable Nigerian law and by the courts of competent jurisdiction in Nigeria."
    },
    {
      "id": "contact-information",
      "number": "22",
      "title": "CONTACT INFORMATION",
      "content": "For questions, complaints, or requests relating to these Terms, Users may contact DELIVA through the following official channels:\nEmail: support@delivaglobe.com\nWebsite: www.delivaglobe.com\nBusiness Address: white house, ejionye ndubisi lodge by adawari hostel, omuokiri Aluu\nPhone No: +2347015548163"
    },
    {
      "id": "version-control",
      "number": "23",
      "title": "VERSION CONTROL",
      "content": "These Terms and Conditions were issued by Deliva Globe Ltd and may be updated from time to time.\nDocument Title: DELIVA Platform Terms and Conditions\nVersion: 1.0\nLast Updated: November 2026.\n©2026, Deliva Globe Ltd. All rights reserved.\nDELIVA — Beyond delivery"
    }
  ]$json$::jsonb,
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  document_title = EXCLUDED.document_title,
  version = EXCLUDED.version,
  introduction_title = EXCLUDED.introduction_title,
  introduction = EXCLUDED.introduction,
  sections = EXCLUDED.sections,
  updated_at = now();

-- ============================================================================
-- SEED: Privacy Policy ('privacy')
-- ============================================================================
INSERT INTO public.legal_documents (
  slug,
  title,
  document_title,
  version,
  introduction_title,
  introduction,
  sections,
  updated_at
)
VALUES (
  'privacy',
  'DELIVA GLOBE LTD PRIVACY POLICY NOVEMBER 2026',
  'DELIVA Platform Privacy Policy',
  '1.0',
  'INTRODUCTION',
  $intro$Deliva Globe Ltd ("DELIVA", "we", "us" or "our") operates a technology-enabled logistics platform that connects businesses and customers with delivery partners to facilitate reliable last-mile delivery services.
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
If you have questions about this Policy or how we handle your personal information, please contact us through the details provided at the end of this document.$intro$,
  $json$[
    {
      "id": "changes-to-this-privacy-policy",
      "number": "1",
      "title": "CHANGES TO THIS PRIVACY POLICY",
      "content": "We may update this Privacy Policy from time to time to reflect changes in our services, technology, business operations, legal obligations or data protection practices.\nWhere changes are made, we will update the revised Policy on our website, mobile applications or other relevant communication channels.\nWhere a change materially affects your privacy rights or how we process your personal information, we will take reasonable steps to bring the change to your attention.\nThe updated Policy will take effect from the date stated in the revised version.\nWe encourage you to review this Policy periodically to remain informed about how DELIVA handles personal information."
    },
    {
      "id": "personal-information-we-collect",
      "number": "2",
      "title": "PERSONAL INFORMATION WE COLLECT",
      "content": "The information we collect depends on how you interact with DELIVA and which services you use.\nWe aim to collect only information that is reasonably necessary for providing our services, managing our operations, meeting legal obligations and improving the DELIVA platform.\n### 2.1. Information Collected from Users and Customers\nWhen you register, request a delivery or use DELIVA's services, we may collect:\n• Full name.\n• Phone number.\n• Email address.\n• Delivery and pickup addresses.\n• Account login information.\n• Delivery instructions.\n• Recipient details provided for a delivery.\n• Delivery request and transaction history.\n• Payment confirmation and transaction references.\n• Customer support communications and complaints.\n• Relevant location information, where permitted.\n### 2.2. Information Collected from Merchants\nWhen a business registers or uses DELIVA to arrange deliveries, we may collect:\n• Business name and contact details.\n• Business address and operating location.\n• Name and contact details of authorised representatives.\n• Business registration information, where required.\n• Account and login information.\n• Pickup and delivery addresses.\n• Delivery requests and transaction records.\n• Payment and settlement information.\n• Relevant business verification documents.\n• Communications with DELIVA's support and operations teams.\nWhere a merchant provides personal information about its employees, customers or representatives, the merchant is responsible for ensuring that it has the necessary authority or lawful basis to provide that information to DELIVA.\n### 2.3. Information Collected from Delivery Partners\nIndividuals applying to become DELIVA Delivery Partners may be required to provide information necessary for registration, identity verification, onboarding, delivery coordination and operational management.\nThis may include:\n• Full name.\n• Date of birth or age confirmation.\n• Phone number and email address.\n• Residential address.\n• Government-issued identification.\n• Passport photograph.\n• Driver's licence, where applicable.\n• Vehicle registration details.\n• Vehicle type, make, model, colour and plate number.\n• Proof of vehicle ownership or authorisation to use the vehicle.\n• Next-of-kin information.\n• Guarantor information and supporting documents, where required.\n• Payment and settlement details.\n• Delivery history and performance records.\n• Training, onboarding and verification records.\n• Reports, complaints or incident records relating to delivery activities.\nWe may also collect information relating to a rider's vehicle, delivery activity and compliance with DELIVA's operational and safety requirements.\n### 2.4. Information Collected Through Communication\nWhen you contact DELIVA through our support channels, email, telephone, mobile application or other approved communication channels, we may collect and retain relevant information from those interactions.\nThis may include:\n• The content of messages and enquiries.\n• Complaint details.\n• Feedback and suggestions.\n• Information provided during dispute resolution.\n• Relevant attachments, photographs or supporting documents.\nWhere calls or communications are recorded, we will provide appropriate notice where required by law.\n### 2.5. Information Collected Automatically\nWhen you access or use our website, mobile applications or digital services, we may automatically collect certain technical information, including:\n• Device type and operating system.\n• Application version.\n• IP address.\n• Device identifiers.\n• Browser type.\n• Network and connection information.\n• Application usage information.\n• Login activity and timestamps.\n• Error reports and diagnostic information.\nWe use this information to maintain the security, functionality and performance of our digital services."
    },
    {
      "id": "how-we-collect-personal-information",
      "number": "3",
      "title": "HOW WE COLLECT PERSONAL INFORMATION",
      "content": "We may collect personal information through different methods, including:\n### 3.1. Directly from You\nWe collect information when you:\n• Create or update an account.\n• Register as a customer, merchant or delivery partner.\n• Request or receive a delivery.\n• Submit onboarding or verification documents.\n• Make a payment through an approved payment channel.\n• Contact our customer support team.\n• Submit a complaint, review or feedback.\n• Participate in a survey, promotion or research activity.\n• Communicate with DELIVA through our website, applications, email or other channels.\n### 3.2. Automatically Through Our Platform\nWe may collect technical, usage and location-related information through your interaction with the DELIVA website, mobile applications and services, subject to your device permissions and applicable law.\n### 3.3. From Third Parties\nWhere lawful and necessary, we may receive relevant information from:\n• Payment service providers.\n• Identity verification providers.\n• Business verification services.\n• Fraud prevention and security providers.\n• Merchants and business representatives.\n• Delivery partners.\n• Other service providers supporting our operations.\nWe will process personal information obtained from third parties in accordance with applicable data protection requirements."
    },
    {
      "id": "location-information",
      "number": "4",
      "title": "LOCATION INFORMATION",
      "content": "Location information is important to coordinating pickup and delivery services.\nDepending on the service being used and the permissions granted on your device, DELIVA may collect location information through GPS, IP address or other available location technologies.\n### 4.1. Users and Customers\nWe may use location information to:\n• Identify or confirm pickup and delivery locations.\n• Coordinate delivery requests.\n• Provide relevant delivery updates.\n• Support delivery tracking where available.\n• Resolve delivery-related complaints.\n• Improve delivery coordination and service efficiency.\n### 4.2. Delivery Partners\nWe may collect a Delivery Partner's location during active delivery activities, subject to applicable permissions and legal requirements.\nThis information may be used to:\n• Coordinate delivery assignments.\n• Support pickup and delivery operations.\n• Provide delivery progress updates where available.\n• Assist with route coordination.\n• Investigate delivery incidents.\n• Improve operational efficiency and rider safety.\nLocation permissions may be managed through your device settings. However, disabling certain location permissions may affect your ability to use features that depend on location information.\nDELIVA will not use location information for purposes unrelated to its services unless permitted by law or otherwise appropriately authorised."
    },
    {
      "id": "cookies-and-similar-technologies",
      "number": "5",
      "title": "COOKIES AND SIMILAR TECHNOLOGIES",
      "content": "Where our website or digital services use cookies or similar technologies, we may use them to:\n• Improve website functionality.\n• Remember certain user preferences.\n• Understand how visitors interact with our website.\n• Monitor website performance.\n• Identify technical problems.\n• Improve the relevance and usability of our services.\nCookies are small files stored on your device by a website. They may help a website recognise a returning visitor or remember certain preferences.\nYou may manage or disable cookies through your browser settings. However, disabling certain cookies may affect the functionality of some website features.\nWhere required by applicable law, we will provide appropriate information and obtain consent before using non-essential cookies or similar tracking technologies."
    },
    {
      "id": "how-we-use-your-personal-information",
      "number": "6",
      "title": "HOW WE USE YOUR PERSONAL INFORMATION",
      "content": "DELIVA may use personal information for the following purposes:\n### 6.1. Providing Delivery Services\nTo:\n• Create and manage user accounts.\n• Receive and process delivery requests.\n• Coordinate merchants, customers and delivery partners.\n• Assign and manage delivery requests.\n• Facilitate pickup and delivery activities.\n• Provide delivery updates and notifications.\n• Confirm successful or unsuccessful deliveries.\n• Maintain delivery records.\n### 6.2. Account Management and Verification\nTo:\n• Verify user identities where necessary.\n• Review merchant registration information.\n• Verify delivery partner identities and documents.\n• Manage account access.\n• Prevent unauthorised account use.\n• Maintain accurate account records.\n### 6.3. Payment and Financial Administration\nTo:\n• Facilitate payment for delivery services.\n• Confirm payment transactions.\n• Process eligible rider payments and settlements.\n• Maintain transaction records.\n• Investigate payment discrepancies.\n• Meet financial, accounting and regulatory obligations.\nDELIVA does not intend to collect or store full payment card details unless this is specifically required and appropriately secured. Where payments are processed through third-party payment providers, their applicable privacy and security policies may also apply.\n### 6.4. Customer Support and Communication\nTo:\n• Respond to enquiries.\n• Provide delivery assistance.\n• Resolve complaints and disputes.\n• Communicate service updates.\n• Investigate delivery-related incidents.\n• Notify users of changes affecting their accounts or services.\n### 6.5. Safety, Security and Fraud Prevention\nTo:\n• Protect users, merchants and delivery partners.\n• Detect and prevent fraudulent activities.\n• Investigate suspicious transactions.\n• Review reported incidents.\n• Maintain platform security.\n• Enforce our Terms and Conditions.\n• Protect the integrity of our delivery network.\n### 6.6. Service Improvement and Development\nTo:\n• Understand how users interact with our platform.\n• Identify technical and operational problems.\n• Improve delivery coordination.\n• Evaluate service performance.\n• Develop new features and services.\n• Conduct internal research and analysis.\n• Improve the overall customer and delivery partner experience.\nWhere possible, we may use aggregated or de-identified information for analysis and service improvement.\n### 6.7. Marketing and Promotional Communication\nWhere permitted by law and subject to applicable consent requirements, we may use your contact information to communicate information about DELIVA's services, updates, offers or promotions.\nYou may opt out of promotional communications at any time.\nHowever, opting out of marketing messages will not prevent us from sending essential service communications, such as delivery updates, account notices, security alerts or payment confirmations.\n### 6.8. Legal and Regulatory Compliance\nWe may process personal information where necessary to:\n• Comply with applicable laws and regulations.\n• Respond to lawful requests from regulatory or law enforcement authorities.\n• Establish, exercise or defend legal claims.\n• Maintain appropriate financial and operational records.\n• Protect the rights, safety and property of DELIVA and other individuals."
    },
    {
      "id": "lawful-basis-for-processing",
      "number": "7",
      "title": "LAWFUL BASIS FOR PROCESSING",
      "content": "DELIVA processes personal information only where an appropriate lawful basis exists under applicable data protection laws.\nDepending on the circumstances, these lawful bases may include:\n### 7.1. Performance of a Contract\nWe may process personal information where necessary to provide services you have requested or to take steps at your request before entering into an agreement.\nFor example, we may use your name, phone number and delivery address to coordinate a delivery.\n### 7.2. Consent\nWe may process certain personal information based on your consent, particularly where consent is required for specific activities such as certain marketing communications or optional data collection.\nWhere processing is based on consent, you may withdraw that consent at any time. Withdrawal does not affect the lawfulness of processing carried out before withdrawal.\n### 7.3. Legal Obligations\nWe may process personal information where necessary to comply with applicable legal or regulatory requirements.\n### 7.4. Legitimate Interests\nWe may process personal information where necessary for legitimate business purposes, provided those interests do not override your rights and freedoms.\nThese purposes may include fraud prevention, platform security, service improvement, operational management and dispute resolution.\n### 7.5. Vital Interests and Other Lawful Grounds\nIn limited circumstances, we may process personal information where necessary to protect someone's vital interests or where another lawful basis recognised by applicable data protection law applies."
    },
    {
      "id": "sharing-and-disclosure-of-personal-information",
      "number": "8",
      "title": "SHARING AND DISCLOSURE OF PERSONAL INFORMATION",
      "content": "DELIVA does not sell personal information to third parties.\nHowever, we may share relevant personal information where necessary to provide our services, operate our business, meet legal obligations or protect the rights and safety of individuals.\nInformation may be shared with the following categories of recipients:\n### 8.1. Delivery Partners\nWe may share relevant delivery information with assigned Delivery Partners, including:\n• Customer or recipient name.\n• Pickup and delivery addresses.\n• Contact details necessary for completing the delivery.\n• Delivery instructions.\n• Relevant package or delivery information.\nThis information is shared to enable the assigned rider to complete the delivery.\n### 8.2. Users and Merchants\nWe may share relevant delivery information between customers and merchants to facilitate delivery coordination, order fulfilment and issue resolution.\nOnly information reasonably necessary for the relevant service should be shared.\n### 8.3. Payment Service Providers\nWe may share relevant transaction information with payment service providers to process payments, confirm transactions, manage settlements and investigate payment-related issues.\n### 8.4. Technology and Operational Service Providers\nWe may share information with trusted service providers who support our operations, including:\n• Cloud hosting and storage providers.\n• Software and technology providers.\n• Communication and notification providers.\n• Identity verification providers.\n• Analytics and security providers.\n• Customer support service providers.\nSuch providers should only process personal information in accordance with applicable agreements, authorised instructions and relevant data protection requirements.\n### 8.5. Professional Advisers\nWhere necessary, we may share information with professional advisers, including legal practitioners, auditors, accountants and financial advisers, subject to appropriate confidentiality obligations.\n### 8.6. Government and Regulatory Authorities\nWe may disclose personal information to courts, law enforcement agencies, regulators or other public authorities where required or permitted by applicable law.\n### 8.7. Business Transactions\nIf DELIVA undergoes a merger, acquisition, restructuring, financing or transfer of business assets, relevant personal information may be disclosed as part of that process, subject to applicable data protection requirements.\nWhere necessary, we will take reasonable steps to ensure that any recipient handles the information appropriately."
    },
    {
      "id": "third-party-services-and-links",
      "number": "9",
      "title": "THIRD-PARTY SERVICES AND LINKS",
      "content": "Our website, mobile applications or other digital services may contain links to third-party websites, applications or services.\nWe may also rely on third-party providers to support payment processing, identity verification, hosting, communications, analytics and other operational functions.\nThese third parties may have their own privacy policies and data protection practices.\nDELIVA is not responsible for the independent privacy practices of third-party websites or services that it does not control.\nWe encourage you to review the relevant privacy policies before providing personal information directly to third-party services.\nWhere a third-party service processes personal information on DELIVA's behalf, we will take reasonable steps to ensure that appropriate contractual and data protection safeguards are in place."
    },
    {
      "id": "communications-and-customer-support",
      "number": "10",
      "title": "COMMUNICATIONS AND CUSTOMER SUPPORT",
      "content": "DELIVA may communicate with you through the contact information associated with your account or provided during your interaction with our services.\nThese communications may include:\n• Account registration and verification messages.\n• Delivery confirmations and updates.\n• Pickup and delivery notifications.\n• Payment confirmations.\n• Service announcements.\n• Customer support responses.\n• Security notifications.\n• Relevant operational instructions.\nCommunications may take place through the DELIVA platform, telephone, email, SMS, WhatsApp or other approved channels.\nWhere communications are recorded or retained, the information may be used for customer support, quality assurance, fraud prevention, operational monitoring and dispute resolution, in accordance with applicable law.\n### Communication During Delivery Transit\nFor safety and proper coordination, DELIVA may require Delivery Partners not to respond to customer or merchant calls and messages while actively riding or transporting packages.\nDuring this period, delivery-related enquiries, complaints, instructions and requests for assistance should be directed through the DELIVA Support Team.\nRelevant communications between users, riders and the support team may be retained where necessary to coordinate deliveries, resolve complaints and maintain accurate operational records."
    },
    {
      "id": "surveys-feedback-and-research",
      "number": "11",
      "title": "SURVEYS, FEEDBACK AND RESEARCH",
      "content": "DELIVA may invite users, merchants and delivery partners to participate in optional surveys, interviews or research activities to help us understand their experiences and improve our services.\nWhere you voluntarily participate, we may collect the information you provide, including feedback, opinions and relevant service experiences.\nWe will inform you where additional personal information is requested for a research activity and obtain consent where required.\nParticipation in optional surveys or research activities is voluntary and will not ordinarily affect your ability to use DELIVA's services."
    },
    {
      "id": "data-security",
      "number": "12",
      "title": "DATA SECURITY",
      "content": "DELIVA takes reasonable technical and organisational measures to protect personal information against:\n• Unauthorised access.\n• Loss or destruction.\n• Unauthorised disclosure.\n• Alteration or misuse.\n• Unlawful processing.\n• Other forms of security compromise.\nDepending on the nature of the information and the risks involved, our security measures may include access controls, authentication procedures, encryption, secure system configurations, staff confidentiality requirements and monitoring of relevant systems.\nWe also take reasonable steps to limit access to personal information to individuals and service providers who need it for authorised business purposes.\nHowever, no digital platform, internet transmission or storage system can be guaranteed to be completely secure.\nYou are responsible for keeping your account credentials confidential and notifying DELIVA promptly if you suspect unauthorised access to your account.\nWhere a personal data breach occurs, DELIVA will take appropriate steps to investigate, contain and address the incident and make any notifications required by applicable law."
    },
    {
      "id": "international-data-transfers",
      "number": "13",
      "title": "INTERNATIONAL DATA TRANSFERS",
      "content": "Some of the technology or service providers supporting DELIVA may process or store personal information outside Nigeria.\nWhere personal information is transferred outside Nigeria, DELIVA will take reasonable steps to ensure that the transfer complies with applicable data protection laws.\nThis may include assessing the destination country's data protection framework and implementing appropriate safeguards or other lawful transfer mechanisms where required.\nWe will not knowingly transfer personal information internationally without an appropriate lawful basis and required safeguards."
    },
    {
      "id": "retention-of-personal-information",
      "number": "14",
      "title": "RETENTION OF PERSONAL INFORMATION",
      "content": "DELIVA will retain personal information only for as long as reasonably necessary for the purposes for which it was collected, including the provision of services, operational management, dispute resolution, fraud prevention and compliance with legal obligations.\nRetention periods may vary depending on:\n• The type of personal information.\n• The nature of the service provided.\n• The status of the user's account.\n• Financial and accounting requirements.\n• Legal and regulatory obligations.\n• Outstanding complaints, investigations or disputes.\n• Legitimate business and security needs.\nFor example, delivery and transaction records may need to be retained for a period required by applicable financial, tax or other laws.\nWhere personal information is no longer required, DELIVA will take reasonable steps to securely delete, anonymise or de-identify it, subject to any legal obligation to retain the information."
    },
    {
      "id": "your-data-protection-rights",
      "number": "15",
      "title": "YOUR DATA PROTECTION RIGHTS",
      "content": "Subject to applicable law and relevant exceptions, you may have the right to:\n### 15.1. Right to Be Informed\nYou have the right to receive information about how DELIVA collects and processes your personal information.\n### 15.2. Right of Access\nYou may request confirmation of whether DELIVA holds personal information about you and request access to that information.\n### 15.3. Right to Rectification\nYou may request that inaccurate, incomplete or outdated personal information be corrected or updated.\n### 15.4. Right to Erasure\nYou may request the deletion of your personal information where the law permits.\nHowever, DELIVA may retain certain information where it is required to comply with legal obligations, resolve disputes, prevent fraud or protect legitimate business interests.\n### 15.5. Right to Restrict Processing\nYou may request that DELIVA restrict the processing of your personal information in circumstances recognised by applicable law.\n### 15.6. Right to Object\nYou may object to certain forms of processing, including processing based on legitimate interests or processing for direct marketing, subject to applicable legal provisions.\n### 15.7. Right to Data Portability\nWhere applicable, you may request that certain personal information be provided to you or transferred to another organisation in a structured, commonly used and machine-readable format.\n### 15.8. Right to Withdraw Consent\nWhere DELIVA relies on your consent to process personal information, you may withdraw that consent at any time.\n### 15.9. Right to Lodge a Complaint\nYou may lodge a complaint with the Nigeria Data Protection Commission or another relevant supervisory authority where you believe your personal information has been processed unlawfully.\nTo exercise any of these rights, contact DELIVA using the details provided in this Policy.\nWe may request information necessary to verify your identity before responding to a request."
    },
    {
      "id": "account-deactivation-and-deletion-requests",
      "number": "16",
      "title": "ACCOUNT DEACTIVATION AND DELETION REQUESTS",
      "content": "Users, merchants and delivery partners may request account deactivation or deletion through DELIVA's approved support channels, subject to applicable platform procedures.\nDeactivating an account does not automatically mean that all associated personal information will be immediately deleted.\nDELIVA may retain certain information where necessary to:\n• Meet legal or regulatory obligations.\n• Maintain financial and transaction records.\n• Resolve outstanding complaints or disputes.\n• Investigate suspected fraud or misconduct.\n• Protect the security and integrity of the platform.\n• Establish, exercise or defend legal claims.\nWhere information is no longer required for these purposes, DELIVA will take reasonable steps to delete or anonymise it in accordance with its retention practices and applicable law."
    },
    {
      "id": "childrens-privacy",
      "number": "17",
      "title": "CHILDREN'S PRIVACY",
      "content": "DELIVA's services are not intended for individuals who do not meet the minimum age requirements applicable to the relevant service.\nWe do not knowingly collect personal information directly from children in violation of applicable data protection laws.\nWhere we become aware that personal information has been collected from a child unlawfully or without the required authorisation, we will take appropriate steps to address the situation."
    },
    {
      "id": "privacy-responsibilities",
      "number": "18",
      "title": "PRIVACY RESPONSIBILITIES OF USERS, MERCHANTS AND DELIVERY PARTNERS",
      "content": "Everyone who uses DELIVA has a responsibility to handle personal information appropriately.\n### 18.1. Users and Customers\nYou should provide accurate information and avoid sharing another person's personal information unless you have the necessary authority or lawful basis to do so.\n### 18.2. Merchants\nMerchants must ensure that personal information provided to DELIVA, including recipient names, telephone numbers and delivery addresses, is collected and shared lawfully.\nMerchants must not use DELIVA to disclose or process personal information for unauthorised purposes.\n### 18.3. Delivery Partners\nDelivery Partners may receive access to customer and merchant information to complete assigned deliveries.\nThey must:\n• Use customer and merchant information only for authorised delivery purposes.\n• Keep personal information confidential.\n• Avoid sharing customer or merchant details with unauthorised persons.\n• Not use delivery information for personal solicitation or private transactions.\n• Not retain or misuse customer contact information after the delivery.\n• Follow DELIVA's communication, safety and operational policies.\nAny suspected misuse or unauthorised disclosure of personal information should be reported to DELIVA promptly."
    },
    {
      "id": "direct-marketing",
      "number": "19",
      "title": "DIRECT MARKETING",
      "content": "DELIVA may send promotional information about its services, offers, updates and relevant activities where permitted by applicable law.\nWhere consent is required, we will obtain it before sending promotional communications.\nYou may opt out of marketing communications through the available unsubscribe option or by contacting our support team.\nPlease note that opting out of marketing communications will not prevent DELIVA from sending essential service-related messages, including delivery updates, account notifications, security alerts and payment information."
    },
    {
      "id": "data-protection-contact",
      "number": "20",
      "title": "DATA PROTECTION CONTACT",
      "content": "DELIVA is committed to handling personal information responsibly and addressing privacy concerns.\nFor questions, complaints, access requests, correction requests, deletion requests or other data protection enquiries, you may contact us through:\nCompany: Deliva Globe Ltd\nPrivacy Contact Email: privacy@delivaglobe.com\nSupport Email: support@delivaglobe.com\nPhone Number: +2347015548163\nRegistered Business Address: White house, Ejionye Ndubisi lodge by Adawari hostel, Omuokiri, Aluu.\nWe will review privacy requests and respond within the timeframes required by applicable law."
    },
    {
      "id": "governing-law",
      "number": "21",
      "title": "GOVERNING LAW",
      "content": "This Privacy Policy shall be governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act 2023 and other applicable data protection laws and regulations.\nWhere any provision of this Policy conflicts with a mandatory legal requirement, the applicable law shall prevail."
    },
    {
      "id": "final-note",
      "number": "22",
      "title": "FINAL NOTE",
      "content": "At DELIVA, we understand that reliable logistics depends not only on moving packages but also on maintaining the trust of the people and businesses that use our platform.\nWe are committed to handling personal information responsibly, protecting the privacy of our users, merchants and delivery partners, and continually improving our data protection practices.\nDELIVA GLOBE LTD Beyond Delivery\n@2026, All right reserved"
    }
  ]$json$::jsonb,
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  document_title = EXCLUDED.document_title,
  version = EXCLUDED.version,
  introduction_title = EXCLUDED.introduction_title,
  introduction = EXCLUDED.introduction,
  sections = EXCLUDED.sections,
  updated_at = now();
