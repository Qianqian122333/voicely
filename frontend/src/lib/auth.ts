import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db } from "~/server/db";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Use 'sandbox' if you're using the Polar Sandbox environment
  // Remember that access tokens, products, etc. are completely separated between environments.
  // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
  server: "sandbox",
});
const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "92d3c616-8de2-4c9f-af05-8958681a6768", // ID of Product from Polar Dashboard
              slug: "small", // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
            },
            {
              productId: "0c01e5c4-7068-4bba-9943-684b22076cf1", // ID of Product from Polar Dashboard
              slug: "medium", // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
            },
            {
              productId: "6b9da345-56f4-453b-bdb8-cc5eb87e25c2", // ID of Product from Polar Dashboard
              slug: "large", // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
            },
          ],
          successUrl: "/dashboard",
          authenticatedUsersOnly: true,
        }),
        portal(),
        // usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onOrderPaid: async (order) => {
            const externalCustomerId = order.data.customer.externalId;

            if (!externalCustomerId) {
              console.error("No external customer ID found.");
              throw new Error("No external customer id found.");
            }

            const productId = order.data.productId;

            let creditsToAdd = 0;

            switch (productId) {
              case "92d3c616-8de2-4c9f-af05-8958681a6768":
                creditsToAdd = 50;
                break;
              case "0c01e5c4-7068-4bba-9943-684b22076cf1":
                creditsToAdd = 200;
                break;
              case "6b9da345-56f4-453b-bdb8-cc5eb87e25c2":
                creditsToAdd = 400;
                break;
            }

            await db.user.update({
              where: { id: externalCustomerId },
              data: {
                credits: {
                  increment: creditsToAdd,
                },
              },
            });
          },
        }),
      ],
    }),
  ],
});
