"use client";

import { create } from "zustand";

type Organization = {
	id: string;
	name?: string;
	slug?: string;
};

type OrganizationState = {
	selectedOrganization: Organization | null;
	setSelectedOrganization: (org: Organization | null) => void;
};

export const useOrganizationStore = create<OrganizationState>((set) => ({
	selectedOrganization: null,
	setSelectedOrganization: (org) => set({ selectedOrganization: org }),
}));


