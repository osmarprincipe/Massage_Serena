import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Serene Studio database...");

  // Clean up
  await prisma.contentMembershipAccess.deleteMany();
  await prisma.contentPurchase.deleteMany();
  await prisma.content.deleteMany();
  await prisma.userMembership.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.businessInfo.deleteMany();
  await prisma.botSettings.deleteMany();

  // ── Membership Plans ───────────────────────────────────────────────────────
  const normalPlan = await prisma.membershipPlan.create({
    data: {
      name: "Normal",
      level: 1,
      description: "Essential wellness access with core content and booking privileges.",
      price: 49.0,
      billingCycle: "MONTHLY",
      features: JSON.stringify([
        "Access to basic content library",
        "Monthly booking priority",
        "Email support",
        "Member-only discounts",
      ]),
    },
  });

  const vipPlan = await prisma.membershipPlan.create({
    data: {
      name: "VIP",
      level: 2,
      description: "Elevated wellness experience with premium content and priority service.",
      price: 99.0,
      billingCycle: "MONTHLY",
      features: JSON.stringify([
        "Full Normal + VIP content library",
        "Priority booking",
        "Exclusive wellness guides",
        "Monthly consultation",
        "15% discount on services",
      ]),
    },
  });

  const premiumPlan = await prisma.membershipPlan.create({
    data: {
      name: "Premium",
      level: 3,
      description: "The ultimate luxury wellness membership with unlimited access.",
      price: 179.0,
      billingCycle: "MONTHLY",
      features: JSON.stringify([
        "Unlimited content access",
        "Concierge booking",
        "Personalized wellness plan",
        "Unlimited consultations",
        "25% discount on all services",
        "Early access to new content",
        "VIP community access",
      ]),
    },
  });

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@serene.studio",
      name: "Studio Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  // ── Sample Clients & Users ─────────────────────────────────────────────────
  const clientsData = [
    {
      name: "Sofia Ramirez",
      email: "sofia@example.com",
      phone: "+1 (555) 234-5678",
      notes: "Prefers deep tissue. Sensitive lower back. Weekly sessions.",
    },
    {
      name: "Isabella Chen",
      email: "isabella@example.com",
      phone: "+1 (555) 345-6789",
      notes: "Relaxation focus. Aromatherapy recommended. Monthly visitor.",
    },
    {
      name: "Amara Johnson",
      email: "amara@example.com",
      phone: "+1 (555) 456-7890",
      notes: "Sports recovery. Athlete. Bi-weekly appointments.",
    },
    {
      name: "Elena Vasquez",
      email: "elena@example.com",
      phone: "+1 (555) 567-8901",
      notes: "Prenatal massage. 6 months along. Extra care required.",
    },
    {
      name: "Maya Williams",
      email: "maya@example.com",
      phone: "+1 (555) 678-9012",
      notes: "Hot stone preference. Allergic to lavender.",
    },
  ];

  const createdClients = [];
  const createdUsers = [];

  for (const clientData of clientsData) {
    const userHash = await bcrypt.hash("user123", 12);
    const user = await prisma.user.create({
      data: {
        email: clientData.email,
        name: clientData.name,
        phone: clientData.phone,
        passwordHash: userHash,
        role: "USER",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });

    const client = await prisma.client.create({
      data: {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        notes: clientData.notes,
        userId: user.id,
      },
    });

    createdClients.push(client);
    createdUsers.push(user);
  }

  // ── Memberships ────────────────────────────────────────────────────────────
  await prisma.userMembership.create({
    data: {
      userId: createdUsers[0].id,
      planId: premiumPlan.id,
      status: "ACTIVE",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-01-01"),
    },
  });

  await prisma.userMembership.create({
    data: {
      userId: createdUsers[1].id,
      planId: vipPlan.id,
      status: "ACTIVE",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2025-03-01"),
    },
  });

  await prisma.userMembership.create({
    data: {
      userId: createdUsers[2].id,
      planId: normalPlan.id,
      status: "ACTIVE",
      startDate: new Date("2024-06-01"),
      endDate: new Date("2025-06-01"),
    },
  });

  await prisma.userMembership.create({
    data: {
      userId: createdUsers[3].id,
      planId: vipPlan.id,
      status: "CANCELLED",
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-08-01"),
    },
  });

  await prisma.userMembership.create({
    data: {
      userId: createdUsers[4].id,
      planId: normalPlan.id,
      status: "ACTIVE",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2025-09-01"),
    },
  });

  // ── Services ───────────────────────────────────────────────────────────────
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: "Swedish Relaxation",
        description: "A gentle full-body massage ideal for stress relief and relaxation.",
        duration: 60,
        price: 95.0,
      },
    }),
    prisma.service.create({
      data: {
        name: "Deep Tissue Therapy",
        description: "Targeted muscle relief with firm pressure techniques.",
        duration: 75,
        price: 120.0,
      },
    }),
    prisma.service.create({
      data: {
        name: "Hot Stone Ritual",
        description: "Heated basalt stones melt tension and restore energy flow.",
        duration: 90,
        price: 145.0,
      },
    }),
    prisma.service.create({
      data: {
        name: "Prenatal Wellness",
        description: "Safe, nurturing massage designed for expectant mothers.",
        duration: 60,
        price: 110.0,
      },
    }),
    prisma.service.create({
      data: {
        name: "Sports Recovery",
        description: "Performance-focused therapy to accelerate muscle recovery.",
        duration: 60,
        price: 130.0,
      },
    }),
  ]);

  // ── Bookings ───────────────────────────────────────────────────────────────
  const today = new Date();
  const bookingDates = [
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 13, 0),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 9, 30),
  ];

  const bookingStatuses = ["CONFIRMED", "CONFIRMED", "PENDING", "CONFIRMED", "PENDING", "COMPLETED", "COMPLETED"];

  for (let i = 0; i < createdClients.length && i < bookingDates.length; i++) {
    await prisma.booking.create({
      data: {
        clientId: createdClients[i % createdClients.length].id,
        serviceId: services[i % services.length].id,
        date: bookingDates[i],
        duration: services[i % services.length].duration,
        status: bookingStatuses[i],
        notes: i === 0 ? "First session. Client prefers ambient music." : undefined,
      },
    });
  }

  // Extra bookings
  await prisma.booking.create({
    data: {
      clientId: createdClients[1].id,
      serviceId: services[2].id,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 11, 0),
      duration: 90,
      status: "CONFIRMED",
    },
  });

  await prisma.booking.create({
    data: {
      clientId: createdClients[0].id,
      serviceId: services[1].id,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 10, 0),
      duration: 75,
      status: "NO_SHOW",
      notes: "Client did not show. Sent follow-up email.",
    },
  });

  // ── Content ────────────────────────────────────────────────────────────────
  const content = await Promise.all([
    prisma.content.create({
      data: {
        title: "Morning Body Awakening Flow",
        description: "A 20-minute guided self-massage routine to start your day with intention and ease.",
        mediaType: "VIDEO",
        thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
        status: "PUBLISHED",
        publishDate: new Date("2024-01-15"),
      },
    }),
    prisma.content.create({
      data: {
        title: "Deep Tissue Self-Care Guide",
        description: "Professional techniques adapted for home practice. Release chronic tension patterns.",
        mediaType: "PDF",
        thumbnailUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800",
        status: "PUBLISHED",
        separatePurchaseEnabled: true,
        separatePurchasePrice: 24.99,
        publishDate: new Date("2024-02-01"),
      },
    }),
    prisma.content.create({
      data: {
        title: "Nervous System Reset Meditation",
        description: "A 30-minute guided meditation using somatic techniques to calm and reset your nervous system.",
        mediaType: "AUDIO",
        thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
        status: "PUBLISHED",
        publishDate: new Date("2024-03-01"),
      },
    }),
    prisma.content.create({
      data: {
        title: "VIP Facial Lymphatic Drainage",
        description: "Exclusive step-by-step video guide to professional lymphatic drainage techniques.",
        mediaType: "VIDEO",
        thumbnailUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800",
        status: "PUBLISHED",
        separatePurchaseEnabled: true,
        separatePurchasePrice: 34.99,
        publishDate: new Date("2024-04-01"),
      },
    }),
    prisma.content.create({
      data: {
        title: "Premium Wellness Masterclass Series",
        description: "8-part video series covering advanced wellness protocols used by luxury spa professionals.",
        mediaType: "VIDEO",
        thumbnailUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
        status: "PUBLISHED",
        publishDate: new Date("2024-05-01"),
      },
    }),
    prisma.content.create({
      data: {
        title: "Aromatherapy Blend Recipes",
        description: "Curated collection of therapeutic essential oil blends for home and professional use.",
        mediaType: "PDF",
        thumbnailUrl: "https://images.unsplash.com/photo-1547496502-affa22d38842?w=800",
        status: "PUBLISHED",
        separatePurchaseEnabled: true,
        separatePurchasePrice: 19.99,
        publishDate: new Date("2024-06-01"),
      },
    }),
  ]);

  // ── Content Membership Access ──────────────────────────────────────────────
  // Content 1: Normal+ can access
  await prisma.contentMembershipAccess.createMany({
    data: [
      { contentId: content[0].id, planId: normalPlan.id },
      { contentId: content[0].id, planId: vipPlan.id },
      { contentId: content[0].id, planId: premiumPlan.id },
    ],
  });

  // Content 2: All levels, but also purchasable
  await prisma.contentMembershipAccess.createMany({
    data: [
      { contentId: content[1].id, planId: normalPlan.id },
      { contentId: content[1].id, planId: vipPlan.id },
      { contentId: content[1].id, planId: premiumPlan.id },
    ],
  });

  // Content 3: VIP+ access
  await prisma.contentMembershipAccess.createMany({
    data: [
      { contentId: content[2].id, planId: vipPlan.id },
      { contentId: content[2].id, planId: premiumPlan.id },
    ],
  });

  // Content 4: VIP+, purchasable separately
  await prisma.contentMembershipAccess.createMany({
    data: [
      { contentId: content[3].id, planId: vipPlan.id },
      { contentId: content[3].id, planId: premiumPlan.id },
    ],
  });

  // Content 5 & 6: Premium only
  await prisma.contentMembershipAccess.createMany({
    data: [
      { contentId: content[4].id, planId: premiumPlan.id },
      { contentId: content[5].id, planId: premiumPlan.id },
    ],
  });

  // ── Sample Content Purchases (for Normal user sofia to demo purchases page) ──
  await prisma.contentPurchase.create({
    data: {
      userId: createdUsers[2].id, // Amara - Normal membership, purchased VIP content
      contentId: content[3].id,  // VIP Facial Lymphatic Drainage
      pricePaid: 34.99,
      status: "ACTIVE",
    },
  });

  await prisma.contentPurchase.create({
    data: {
      userId: createdUsers[4].id, // Maya - Normal membership
      contentId: content[1].id,  // Deep Tissue Self-Care Guide
      pricePaid: 24.99,
      status: "ACTIVE",
    },
  });

  // ── Business Info ──────────────────────────────────────────────────────────
  await prisma.businessInfo.create({
    data: {
      businessName: "Serene Studio",
      address: "48 Wellness Avenue, Suite 200, New York, NY 10001",
      workingHours: JSON.stringify({
        monday: { open: "09:00", close: "19:00" },
        tuesday: { open: "09:00", close: "19:00" },
        wednesday: { open: "09:00", close: "20:00" },
        thursday: { open: "09:00", close: "20:00" },
        friday: { open: "09:00", close: "18:00" },
        saturday: { open: "10:00", close: "16:00" },
        sunday: { open: null, close: null },
      }),
      phone: "+1 (212) 555-0180",
      email: "hello@serene.studio",
      description:
        "Serene Studio is a luxury wellness and massage therapy practice dedicated to restoring balance, beauty, and vitality. We blend ancient healing traditions with modern science to offer transformative experiences.",
    },
  });

  // ── Bot Settings ───────────────────────────────────────────────────────────
  await prisma.botSettings.create({
    data: {
      businessName: "Serene Studio",
      tone: "Warm & Professional",
      personalityDesc:
        "A knowledgeable, caring wellness guide who speaks with warmth, elegance, and expertise. Never pushy, always supportive.",
      responseStyle: "Concise & Elegant",
      emojiUsage: false,
      greetingMessage:
        "Welcome to Serene Studio. I'm here to help you find the perfect wellness experience. How may I assist you today?",
      fallbackMessage:
        "I'd love to help with that. For personalized assistance, please contact us directly at hello@serene.studio or call +1 (212) 555-0180.",
    },
  });

  console.log("✅ Seed complete!");
  console.log("   Admin: admin@serene.studio / admin123");
  console.log("   User:  sofia@example.com / user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
