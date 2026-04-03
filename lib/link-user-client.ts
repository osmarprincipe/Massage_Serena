import { prisma } from "@/lib/prisma";

/**
 * Ensures a User is linked to exactly one Client record.
 * Called whenever a user account is created or first activated.
 *
 * Resolution order:
 *   1. User already has a linked Client → do nothing.
 *   2. An unlinked Client exists with the same email → link it to this user.
 *   3. No matching Client → create a new one and link it.
 *
 * The email field on Client is not unique, so we look for any unlinked
 * Client with a matching email. If all matching Clients are already linked
 * (data integrity issue), we still create a fresh one for this user.
 */
export async function linkUserToClient(params: {
  userId: string;
  email: string;
  name: string | null;
  phone?: string | null;
}): Promise<void> {
  const { userId, email, name, phone } = params;

  // 1. Already linked?
  const alreadyLinked = await prisma.client.findUnique({ where: { userId } });
  if (alreadyLinked) {
    console.log(`[linkUserToClient] User ${userId} already linked to client ${alreadyLinked.id}`);
    return;
  }

  // 2. Find an unlinked Client with the same email
  const unlinkedClient = await prisma.client.findFirst({
    where: { email, userId: null },
  });

  if (unlinkedClient) {
    await prisma.client.update({
      where: { id: unlinkedClient.id },
      data: {
        userId,
        // Fill in missing fields from the user record
        ...(name && !unlinkedClient.name ? { name } : {}),
        ...(phone && !unlinkedClient.phone ? { phone } : {}),
      },
    });
    console.log(
      `[linkUserToClient] Linked user ${userId} to existing client ${unlinkedClient.id} (email=${email})`
    );
    return;
  }

  // 3. Create a new Client
  const newClient = await prisma.client.create({
    data: {
      name: name || email,
      email,
      phone: phone ?? null,
      userId,
    },
  });
  console.log(
    `[linkUserToClient] Created new client ${newClient.id} for user ${userId} (email=${email})`
  );
}
