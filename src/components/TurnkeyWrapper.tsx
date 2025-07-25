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
        defaultOrganizationId: organizationId,
        rpId: typeof window !== 'undefined' ? window.location.hostname : "localhost",
        iframeUrl: "https://auth.turnkey.com",
        serverSignUrl: "/api/sign",
      }}
    >
      {children}
    </TurnkeyProvider>
  );
}