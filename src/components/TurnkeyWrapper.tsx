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
      }}
    >
      {children}
    </TurnkeyProvider>
  );
}