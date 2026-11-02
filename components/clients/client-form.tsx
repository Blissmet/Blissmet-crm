"use client";

import {
  useActionState,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  BriefcaseBusiness,
  IdCard,
  Save,
  UserRound,
} from "lucide-react";

import {
  createClientRecordAction,
  updateClientRecordAction,
} from "@/lib/actions/clients";
import { INITIAL_CLIENT_FORM_STATE } from "@/lib/actions/types";
import {
  CLIENT_STATUSES,
  EMPLOYMENT_TYPES,
  GENDERS,
} from "@/lib/constants";
import type { ClientWithPhoto } from "@/lib/types";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "./photo-upload";

type ClientFormProps = {
  mode: "create" | "edit";
  initialClient?: ClientWithPhoto;
};

type ClientFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  work_phone: string;
  date_of_birth: string;
  gender: string;
  client_id: string;
  department: string;
  designation: string;
  employment_type: string;
  date_of_joining: string;
  total_experience: string;
  status: string;
  aadhaar: string;
  address: string;
  notes: string;
};

function getInitialFormValues(client?: ClientWithPhoto): ClientFormValues {
  return {
    first_name: client?.first_name ?? "",
    last_name: client?.last_name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    work_phone: client?.work_phone ?? "",
    date_of_birth: client?.date_of_birth ?? "",
    gender: client?.gender ?? "",
    client_id: client?.client_id ?? "",
    department: client?.department ?? "",
    designation: client?.designation ?? "",
    employment_type: client?.employment_type ?? "",
    date_of_joining: client?.date_of_joining ?? "",
    total_experience:
      client?.total_experience !== null &&
      client?.total_experience !== undefined
        ? String(client.total_experience)
        : "",
    status: client?.status ?? "Active",
    aadhaar: client?.aadhaar ?? "",
    address: client?.address ?? "",
    notes: client?.notes ?? "",
  };
}

const TODAY = new Date().toISOString().slice(0, 10);

export function ClientForm({ mode, initialClient }: ClientFormProps) {
  const action =
    mode === "create" ? createClientRecordAction : updateClientRecordAction;
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_CLIENT_FORM_STATE
  );
  const [photoUploading, setPhotoUploading] = useState(false);
  const [values, setValues] = useState<ClientFormValues>(() =>
    getInitialFormValues(initialClient)
  );

  function handleFieldChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;
    if (!name) return;

    setValues((current) => ({ ...current, [name]: value }));
  }

  function fieldProps(name: keyof ClientFormValues) {
    return {
      value: values[name],
      onChange: handleFieldChange,
    };
  }

  const errors = state.fieldErrors;
  const isSaving = pending || photoUploading;
  const cancelHref =
    mode === "edit" && initialClient
      ? `/clients/${initialClient.id}`
      : "/clients";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {mode === "edit" && initialClient ? (
        <input type="hidden" name="id" value={initialClient.id} />
      ) : null}

      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Unable to save this client</p>
            <p className="mt-0.5">{state.message}</p>
          </div>
        </div>
      ) : null}

      <FormSection
        icon={UserRound}
        title="Personal information"
        description="Basic contact details and identity information for this client."
      >
        <div className="border-b border-ink-100 pb-5">
          <PhotoUpload
            firstName={values.first_name}
            lastName={values.last_name}
            initialPath={initialClient?.photo_url ?? null}
            initialUrl={initialClient?.photoSignedUrl ?? null}
            onUploadingChange={setPhotoUploading}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="First name"
            htmlFor="first_name"
            required
            error={errors.first_name}
          >
            <Input
              id="first_name"
              name="first_name"
              autoComplete="given-name"
              placeholder="e.g. Ananya"
              required
              maxLength={80}
              {...fieldProps("first_name")}
              invalid={Boolean(errors.first_name)}
              aria-describedby={errors.first_name ? "first_name-error" : undefined}
            />
          </FormField>

          <FormField
            label="Last name"
            htmlFor="last_name"
            required
            error={errors.last_name}
          >
            <Input
              id="last_name"
              name="last_name"
              autoComplete="family-name"
              placeholder="e.g. Sharma"
              required
              maxLength={80}
              {...fieldProps("last_name")}
              invalid={Boolean(errors.last_name)}
              aria-describedby={errors.last_name ? "last_name-error" : undefined}
            />
          </FormField>

          <FormField
            label="Email address"
            htmlFor="email"
            required
            error={errors.email}
          >
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              required
              maxLength={254}
              {...fieldProps("email")}
              invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </FormField>

          <FormField
            label="Phone number"
            htmlFor="phone"
            required
            error={errors.phone}
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1 555 010 2030"
              required
              maxLength={25}
              {...fieldProps("phone")}
              invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
          </FormField>

          <FormField
            label="Work phone"
            htmlFor="work_phone"
            error={errors.work_phone}
          >
            <Input
              id="work_phone"
              name="work_phone"
              type="tel"
              placeholder="+1 555 010 2040"
              maxLength={25}
              {...fieldProps("work_phone")}
              invalid={Boolean(errors.work_phone)}
              aria-describedby={errors.work_phone ? "work_phone-error" : undefined}
            />
          </FormField>

          <FormField
            label="Date of birth"
            htmlFor="date_of_birth"
            error={errors.date_of_birth}
          >
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              max={TODAY}
              {...fieldProps("date_of_birth")}
              invalid={Boolean(errors.date_of_birth)}
              aria-describedby={
                errors.date_of_birth ? "date_of_birth-error" : undefined
              }
            />
          </FormField>

          <FormField
            label="Gender"
            htmlFor="gender"
            error={errors.gender}
          >
            <Select
              id="gender"
              name="gender"
              {...fieldProps("gender")}
              invalid={Boolean(errors.gender)}
              aria-describedby={errors.gender ? "gender-error" : undefined}
            >
              <option value="">Select gender</option>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        icon={BriefcaseBusiness}
        title="Employment information"
        description="Role, engagement type, and current account status."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="Client ID"
            htmlFor="client_id"
            required
            error={errors.client_id}
            hint="Must be unique across your workspace."
          >
            <Input
              id="client_id"
              name="client_id"
              placeholder="e.g. BLM-001"
              required
              maxLength={40}
              {...fieldProps("client_id")}
              invalid={Boolean(errors.client_id)}
              aria-describedby={
                errors.client_id ? "client_id-error" : "client_id-hint"
              }
              className="font-mono uppercase"
            />
          </FormField>

          <FormField
            label="Department"
            htmlFor="department"
            required
            error={errors.department}
          >
            <Input
              id="department"
              name="department"
              placeholder="e.g. Engineering"
              required
              maxLength={100}
              {...fieldProps("department")}
              invalid={Boolean(errors.department)}
              aria-describedby={errors.department ? "department-error" : undefined}
            />
          </FormField>

          <FormField
            label="Designation"
            htmlFor="designation"
            required
            error={errors.designation}
          >
            <Input
              id="designation"
              name="designation"
              placeholder="e.g. Product Designer"
              required
              maxLength={100}
              {...fieldProps("designation")}
              invalid={Boolean(errors.designation)}
              aria-describedby={
                errors.designation ? "designation-error" : undefined
              }
            />
          </FormField>

          <FormField
            label="Employment type"
            htmlFor="employment_type"
            required
            error={errors.employment_type}
          >
            <Select
              id="employment_type"
              name="employment_type"
              required
              {...fieldProps("employment_type")}
              invalid={Boolean(errors.employment_type)}
              aria-describedby={
                errors.employment_type ? "employment_type-error" : undefined
              }
            >
              <option value="">Select employment type</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Date of joining"
            htmlFor="date_of_joining"
            required
            error={errors.date_of_joining}
          >
            <Input
              id="date_of_joining"
              name="date_of_joining"
              type="date"
              required
              {...fieldProps("date_of_joining")}
              invalid={Boolean(errors.date_of_joining)}
              aria-describedby={
                errors.date_of_joining ? "date_of_joining-error" : undefined
              }
            />
          </FormField>

          <FormField
            label="Total experience"
            htmlFor="total_experience"
            error={errors.total_experience}
            hint="In years, e.g. 4.5."
          >
            <Input
              id="total_experience"
              name="total_experience"
              type="number"
              min="0"
              max="60"
              step="0.1"
              inputMode="decimal"
              placeholder="e.g. 4.5"
              {...fieldProps("total_experience")}
              invalid={Boolean(errors.total_experience)}
              aria-describedby={
                errors.total_experience
                  ? "total_experience-error"
                  : "total_experience-hint"
              }
            />
          </FormField>

          <FormField
            label="Account status"
            htmlFor="status"
            required
            error={errors.status}
          >
            <Select
              id="status"
              name="status"
              required
              {...fieldProps("status")}
              invalid={Boolean(errors.status)}
              aria-describedby={errors.status ? "status-error" : undefined}
            >
              {CLIENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        icon={IdCard}
        title="Additional information"
        description="Sensitive identity details, address, and internal notes."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Aadhaar number"
            htmlFor="aadhaar"
            error={errors.aadhaar}
            hint="12 digits. Visible only to authorized administrators."
          >
            <Input
              id="aadhaar"
              name="aadhaar"
              inputMode="numeric"
              placeholder="0000 0000 0000"
              maxLength={14}
              {...fieldProps("aadhaar")}
              invalid={Boolean(errors.aadhaar)}
              aria-describedby={errors.aadhaar ? "aadhaar-error" : "aadhaar-hint"}
            />
          </FormField>
        </div>

        <FormField label="Address" htmlFor="address" error={errors.address}>
          <Textarea
            id="address"
            name="address"
            rows={3}
            maxLength={1000}
            placeholder="Street, city, state, postal code, country"
            {...fieldProps("address")}
            invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? "address-error" : undefined}
          />
        </FormField>

        <FormField label="Notes" htmlFor="notes" error={errors.notes}>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={4000}
            placeholder="Add any relevant internal context about this client..."
            {...fieldProps("notes")}
            invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? "notes-error" : undefined}
          />
        </FormField>
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-col-reverse gap-3 rounded-xl border border-ink-200 bg-surface/95 p-3.5 shadow-elevated backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <p className="text-[11px] text-ink-400">
          <span className="text-red-500">*</span> Required fields. Changes are
          saved to your secure workspace.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Link
            href={cancelHref}
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Cancel
          </Link>
          <Button type="submit" loading={isSaving} loadingText="Saving...">
            <Save className="h-4 w-4" aria-hidden="true" />
            {mode === "create" ? "Create client" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-100 bg-ink-50 text-ink-500">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-[14px] font-semibold text-ink-900">{title}</h2>
          <p className="mt-0.5 text-[12px] leading-5 text-ink-500">
            {description}
          </p>
        </div>
      </div>
      <div className="space-y-4 px-5 py-5 sm:px-6">{children}</div>
    </Card>
  );
}
