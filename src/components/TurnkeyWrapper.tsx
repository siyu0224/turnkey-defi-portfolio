"use client";

import { TurnkeyProvider } from "@turnkey/sdk-react";
import { ReactNode } from "react";

interface TurnkeyWrapperProps {
  children: ReactNode;
  apiBaseUrl: string;
  organizationId: string;
}

export default function TurnkeyWrapper({ 
  children, 
  apiBaseUrl, 
  organizationId 
}: TurnkeyWrapperProps) {
  // Removed unused serverSign function

  return (
    <TurnkeyProvider
      config={{
        apiBaseUrl,
        serverSignUrl: "/api/sign",
        defaultOrganizationId: organizationId,
        // Authentication configuration
        rpId: process.env.NEXT_PUBLIC_DOMAIN || (typeof window !== 'undefined' ? window.location.hostname : "localhost"),
        // Optional: iframe URL for legacy authentication (if needed)
        iframeUrl: process.env.NEXT_PUBLIC_IFRAME_URL,
        // WebAuthn configuration
        webauthnConfig: {
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
            residentKey: "preferred",
          },
          attestation: "direct",
          timeout: 60000,
        },
        // Session configuration
        sessionConfig: {
          expirationSeconds: 3600, // 1 hour
          sessionType: "READ_WRITE",
        },
      }}
    >
      {children}
    </TurnkeyProvider>
  );
}