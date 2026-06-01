import { useState } from 'react';
import { Header } from '../components/layout/header';
import { Sidebar } from '../components/layout/sidebar';
import { DoctypeDocs } from '../components/doctype/doctype-docs';
import { FileText, ArrowRight } from 'lucide-react';

export function ApiHubPage() {
  const [selectedDoctype, setSelectedDoctype] = useState<string | null>(null);

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-zinc-950">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedDoctype={selectedDoctype}
          onSelectDoctype={setSelectedDoctype}
        />

        <main className="flex-1 overflow-y-auto">
          {selectedDoctype ? (
            <DoctypeDocs doctype={selectedDoctype} />
          ) : (
            <WelcomeScreen />
          )}
        </main>
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome to API Hub
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          Select a DocType from the sidebar to view its REST API documentation.
          Each DocType comes with complete CRUD examples, parameter descriptions,
          and ready-to-use cURL commands.
        </p>

        <div className="grid grid-cols-2 gap-4 text-left">
          <FeatureCard
            title="List Records"
            description="GET /api/resource/:doctype with filters, sorting, and pagination"
            icon={<ArrowRight className="h-4 w-4" />}
          />
          <FeatureCard
            title="Get Record"
            description="GET /api/resource/:doctype/:name to fetch a single document"
            icon={<ArrowRight className="h-4 w-4" />}
          />
          <FeatureCard
            title="Create Record"
            description="POST /api/resource/:doctype with required fields"
            icon={<ArrowRight className="h-4 w-4" />}
          />
          <FeatureCard
            title="Update Record"
            description="PUT /api/resource/:doctype/:name for partial updates"
            icon={<ArrowRight className="h-4 w-4" />}
          />
        </div>

        <p className="mt-8 text-xs text-zinc-400">
          Built with Frappe REST API - Token authentication, filters, and more.
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-violet-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-900">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-violet-500">{icon}</span>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
      </div>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  );
}
