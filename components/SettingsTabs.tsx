"use client";

import { useState } from "react";
import { User, Shield, Database } from "lucide-react";
import ProfileTab from "./settings/ProfileTab";
import SecurityTab from "./settings/SecurityTab";
import DataManagementTab from "./settings/DataManagementTab";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "data-management", label: "Data Management", icon: Database },
];

interface SettingsTabsProps {
  user?: any;
  profile?: any;
}

export default function SettingsTabs({ user, profile }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("profile");

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab user={user} profile={profile} />;
      case "security":
        return <SecurityTab user={user} />;
      case "data-management":
        return <DataManagementTab user={user} />;
      default:
        return <ProfileTab user={user} profile={profile} />;
    }
  };

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-gray-300 text-gray-900 bg-gray-50 rounded-t-lg px-3"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {renderTabContent()}
      </div>
    </div>
  );
}
