"""
Business Configuration for Customer Support Agent
Update this file with your actual business information
"""

BUSINESS_INFO = {
    "company_name": "Aurora Salon",
    "tagline": "Glow inside out — modern hair, beauty, and self-care",
    "description": "Aurora Salon is a full-service boutique salon offering hair, nail, skin, and grooming services with a modern, friendly approach. We combine skilled stylists, cruelty-free product lines, and relaxing service in a stylish but comfortable space.",

    "address": "48 Willow Lane, 2nd Floor, Koregaon Park, Pune, Maharashtra 411001",
    "phone_support": "+91 20 4000 4800",
    "email_support": "hello@aurorasalon.example",
    "booking_email": "bookings@aurorasalon.example",
    "website": "https://aurorasalon.example/book",
    "social_media": {
        "instagram": "@AuroraSalon_IN",
        "facebook": "@AuroraSalon_IN"
    },

    "business_hours": {
        "monday": "11:00 AM – 8:00 PM",
        "tuesday": "11:00 AM – 8:00 PM",
        "wednesday": "11:00 AM – 8:00 PM",
        "thursday": "11:00 AM – 8:00 PM",
        "friday": "11:00 AM – 9:00 PM",
        "saturday": "10:00 AM – 9:00 PM",
        "sunday": "10:00 AM – 7:00 PM"
    },

    "services": [
        "Women's Haircut",
        "Men's Haircut",
        "Hair Colouring & Highlights",
        "Keratin Smoothing",
        "Facials & Peels",
        "Manicure & Pedicure",
        "Makeup & Bridal Styling"
    ],

    "pricing_examples": {
        "Women's Haircut": "₹900",
        "Men's Haircut": "₹500",
        "Blow-dry / Styling": "₹700",
        "Balayage / Highlights": "₹4,500+",
        "Signature Facial": "₹1,800",
        "Bridal Makeup": "₹8,000+"
    },

    "packages": {
        "Bridal Package": "Custom quote (includes trial, day-of makeup, hair styling, touch-up kit)",
        "Glow & Go": "₹2,400 (facial + manicure + blow-dry)"
    },

    "booking_policy": {
        "methods": ["Phone", "Website", "WhatsApp", "In-person"],
        "deposit": "30% advance required for bookings over ₹3,000",
        "cancellation": "Free up to 24 hours before appointment; 50% charge within 24 hours; 100% for no-shows",
        "late_arrival": "15+ minutes late may result in a shortened or rescheduled session; full price applies"
    },

    "payment_methods": [
        "Cash",
        "Credit/Debit Cards",
        "UPI (Google Pay, PhonePe, Paytm)",
        "Gift Cards"
    ],

    "safety_standards": [
        "All instruments sanitized between clients",
        "Single-use items where applicable",
        "Cruelty-free, dermatologist-tested products"
    ],

    "amenities": [
        "Elevator access to 2nd floor",
        "Free on-street and paid parking nearby",
        "Complimentary tea, coffee, and bottled water"
    ],

    "gift_cards": "Available in ₹500, ₹1,000, ₹2,500, ₹5,000 denominations",
    "loyalty_program": "Earn 1 point per ₹50 spent; 100 points = ₹500 off; valid for 12 months",

    "key_staff": {
        "manager": "Aisha Kapoor (Senior Creative Director)",
        "colour_specialist": "Rohit Mehra",
        "aesthetician": "Nina Rao"
    },

    "escalation_policy": "Escalate to Aisha Kapoor for complaints, billing issues, or allergic reactions.",
    "tone_guidelines": "Friendly, professional, concise, helpful; never invent policies not listed here.",
    
    "faq_examples": [
        "How do I book an appointment?",
        "Do you accept walk-ins?",
        "Can I request a specific stylist?",
        "What’s your bridal booking process?",
        "What’s your cancellation policy?"
    ]
}


def get_business_info_text():
    """Convert business info to formatted text for the agent instructions"""
    
    # Format business hours
    hours_text = "\n".join([f"  {day.title()}: {time}" for day, time in BUSINESS_INFO['business_hours'].items()])
    
    # Format social media
    social_text = f"Instagram: {BUSINESS_INFO['social_media']['instagram']}, Facebook: {BUSINESS_INFO['social_media']['facebook']}"
    
    # Format pricing examples
    pricing_text = "\n".join([f"  {service}: {price}" for service, price in BUSINESS_INFO['pricing_examples'].items()])
    
    # Format packages
    packages_text = "\n".join([f"  {package}: {details}" for package, details in BUSINESS_INFO['packages'].items()])
    
    # Format booking methods
    booking_methods = ", ".join(BUSINESS_INFO['booking_policy']['methods'])
    
    # Format safety standards
    safety_text = "\n".join([f"  - {standard}" for standard in BUSINESS_INFO['safety_standards']])
    
    # Format amenities
    amenities_text = "\n".join([f"  - {amenity}" for amenity in BUSINESS_INFO['amenities']])
    
    # Format key staff
    staff_text = "\n".join([f"  {role}: {name}" for role, name in BUSINESS_INFO['key_staff'].items()])
    
    # Format FAQ examples
    faq_text = "\n".join([f"  - {question}" for question in BUSINESS_INFO['faq_examples']])
    
    info_text = f"""
BUSINESS INFORMATION:

COMPANY DETAILS:
- Company Name: {BUSINESS_INFO['company_name']}
- Tagline: {BUSINESS_INFO['tagline']}
- Description: {BUSINESS_INFO['description']}

CONTACT INFORMATION:
- Address: {BUSINESS_INFO['address']}
- Phone: {BUSINESS_INFO['phone_support']}
- Email: {BUSINESS_INFO['email_support']}
- Booking Email: {BUSINESS_INFO['booking_email']}
- Website: {BUSINESS_INFO['website']}
- Social Media: {social_text}

BUSINESS HOURS:
{hours_text}

SERVICES OFFERED:
{chr(10).join([f"  - {service}" for service in BUSINESS_INFO['services']])}

PRICING EXAMPLES:
{pricing_text}

PACKAGES:
{packages_text}

BOOKING INFORMATION:
- Booking Methods: {booking_methods}
- Deposit Required: {BUSINESS_INFO['booking_policy']['deposit']}
- Cancellation Policy: {BUSINESS_INFO['booking_policy']['cancellation']}
- Late Arrival Policy: {BUSINESS_INFO['booking_policy']['late_arrival']}

PAYMENT METHODS:
{chr(10).join([f"  - {method}" for method in BUSINESS_INFO['payment_methods']])}

SAFETY STANDARDS:
{safety_text}

AMENITIES:
{amenities_text}

ADDITIONAL SERVICES:
- Gift Cards: {BUSINESS_INFO['gift_cards']}
- Loyalty Program: {BUSINESS_INFO['loyalty_program']}

KEY STAFF:
{staff_text}

ESCALATION POLICY:
{BUSINESS_INFO['escalation_policy']}

COMMON QUESTIONS:
{faq_text}

TONE GUIDELINES:
{BUSINESS_INFO['tone_guidelines']}
"""
    return info_text
