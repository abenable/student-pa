import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { prisma } from '#/db'
import { sendEmail } from '#/lib/email'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your AgentHub password',
        text: `Hello ${user.name || 'there'},\n\nYou requested a password reset for your AgentHub account. Click the link below to reset your password:\n\n${url}\n\nIf you did not request this, you can safely ignore this email.\n\n— AgentHub Team`,
        html: `<p>Hello ${user.name || 'there'},</p>
<p>You requested a password reset for your AgentHub account. Click the link below to reset your password:</p>
<p><a href="${url}" style="color:#0070d1;font-weight:bold;">Reset Password</a></p>
<p>If you did not request this, you can safely ignore this email.</p>
<p>— AgentHub Team</p>`,
      })
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        required: false,
      },
    },
  },
  plugins: [tanstackStartCookies()],
})
