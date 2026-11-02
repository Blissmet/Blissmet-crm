import {
  CLIENT_STATUSES,
  EMPLOYMENT_TYPES,
  GENDERS,
} from "@/lib/constants";
import { isValidPhotoPath } from "@/lib/storage/paths";
import type { ClientStatus } from "@/types/database";

export type ClientInput = {
  client_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  work_phone: string | null;
  photo_url: string | null;
  department: string;
  designation: string;
  employment_type: string;
  status: ClientStatus;
  date_of_joining: string;
  total_experience: number | null;
  date_of_birth: string | null;
  gender: string | null;
  aadhaar: string | null;
  address: string | null;
  notes: string | null;
};

export type ValidationResult =
  | { ok: true; data: ClientInput }
  | { ok: false; fieldErrors: Record<string, string> };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^[0-9+() -]{6,25}$/;
const CLIENT_ID_RE = /^[A-Z0-9][A-Z0-9_-]{0,38}[A-Z0-9]$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function isValidDate(value: string) {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateClientForm(formData: FormData): ValidationResult {
  const fieldErrors: Record<string, string> = {};

  const firstName = text(formData, "first_name");
  const lastName = text(formData, "last_name");
  const email = text(formData, "email").toLowerCase();
  const phone = text(formData, "phone");
  const workPhone = optionalText(formData, "work_phone");
  const clientId = text(formData, "client_id").toUpperCase();
  const department = text(formData, "department");
  const designation = text(formData, "designation");
  const employmentType = text(formData, "employment_type");
  const status = text(formData, "status");
  const dateOfJoining = text(formData, "date_of_joining");
  const totalExperience = text(formData, "total_experience");
  const dateOfBirth = optionalText(formData, "date_of_birth");
  const gender = optionalText(formData, "gender");
  const rawAadhaar = text(formData, "aadhaar");
  const address = optionalText(formData, "address");
  const notes = optionalText(formData, "notes");
  const photoUrl = optionalText(formData, "photo_url");

  if (!firstName) {
    fieldErrors.first_name = "First name is required.";
  } else if (firstName.length > 80) {
    fieldErrors.first_name = "First name must be 80 characters or fewer.";
  }

  if (!lastName) {
    fieldErrors.last_name = "Last name is required.";
  } else if (lastName.length > 80) {
    fieldErrors.last_name = "Last name must be 80 characters or fewer.";
  }

  if (!email) {
    fieldErrors.email = "Email address is required.";
  } else if (email.length > 254 || !EMAIL_RE.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!phone) {
    fieldErrors.phone = "Phone number is required.";
  } else if (!PHONE_RE.test(phone)) {
    fieldErrors.phone = "Enter a valid phone number (6–25 digits).";
  }

  if (workPhone && !PHONE_RE.test(workPhone)) {
    fieldErrors.work_phone = "Enter a valid work phone number.";
  }

  if (!clientId) {
    fieldErrors.client_id = "Client ID is required.";
  } else if (!CLIENT_ID_RE.test(clientId)) {
    fieldErrors.client_id =
      "Use 2–40 letters, numbers, hyphens, or underscores. Start and end with a letter or number.";
  }

  if (!department) {
    fieldErrors.department = "Department is required.";
  } else if (department.length > 100) {
    fieldErrors.department = "Department must be 100 characters or fewer.";
  }

  if (!designation) {
    fieldErrors.designation = "Designation is required.";
  } else if (designation.length > 100) {
    fieldErrors.designation = "Designation must be 100 characters or fewer.";
  }

  if (!(EMPLOYMENT_TYPES as readonly string[]).includes(employmentType)) {
    fieldErrors.employment_type = "Select a valid employment type.";
  }

  if (!(CLIENT_STATUSES as readonly string[]).includes(status)) {
    fieldErrors.status = "Select a valid status.";
  }

  if (!dateOfJoining) {
    fieldErrors.date_of_joining = "Date of joining is required.";
  } else if (!isValidDate(dateOfJoining)) {
    fieldErrors.date_of_joining = "Enter a valid joining date.";
  }

  let experienceValue: number | null = null;
  if (totalExperience) {
    if (!/^\d{1,2}(\.\d)?$/.test(totalExperience)) {
      fieldErrors.total_experience =
        "Use a number between 0 and 60 with up to one decimal place.";
    } else {
      experienceValue = Number(totalExperience);
      if (experienceValue < 0 || experienceValue > 60) {
        fieldErrors.total_experience = "Experience must be between 0 and 60 years.";
      }
    }
  }

  if (dateOfBirth) {
    if (!isValidDate(dateOfBirth)) {
      fieldErrors.date_of_birth = "Enter a valid date of birth.";
    } else {
      const dob = new Date(`${dateOfBirth}T00:00:00Z`);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (dob > today) {
        fieldErrors.date_of_birth = "Date of birth cannot be in the future.";
      } else if (
        dateOfJoining &&
        isValidDate(dateOfJoining) &&
        dob >= new Date(`${dateOfJoining}T00:00:00Z`)
      ) {
        fieldErrors.date_of_birth =
          "Date of birth must be before the date of joining.";
      }
    }
  }

  if (gender && !(GENDERS as readonly string[]).includes(gender)) {
    fieldErrors.gender = "Select a valid gender option.";
  }

  const aadhaar = rawAadhaar.replace(/[\s-]/g, "");
  if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
    fieldErrors.aadhaar = "Aadhaar number must contain exactly 12 digits.";
  }

  if (address && address.length > 1000) {
    fieldErrors.address = "Address must be 1,000 characters or fewer.";
  }

  if (notes && notes.length > 4000) {
    fieldErrors.notes = "Notes must be 4,000 characters or fewer.";
  }

  if (photoUrl && !isValidPhotoPath(photoUrl)) {
    fieldErrors.photo_url = "The profile photo reference is invalid.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      client_id: clientId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      work_phone: workPhone,
      photo_url: photoUrl,
      department,
      designation,
      employment_type: employmentType,
      status: status as ClientStatus,
      date_of_joining: dateOfJoining,
      total_experience: experienceValue,
      date_of_birth: dateOfBirth,
      gender,
      aadhaar: aadhaar || null,
      address,
      notes,
    },
  };
}
