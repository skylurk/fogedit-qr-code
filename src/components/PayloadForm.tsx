"use client";

import type { ReactNode } from "react";
import type { Payload } from "@/lib/qr/payload";
import { Field, inputClass, Segmented, Toggle } from "./ui";

type Props<T extends Payload> = { value: T; onChange: (p: T) => void };

const big = `${inputClass} py-3 text-base`;

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function TextInput({
  label,
  value,
  onChange,
  className = inputClass,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <Field label={label}>
      <input
        {...rest}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
    </Field>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea
        aria-label={label}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} resize-y`}
      />
    </Field>
  );
}

export function PayloadForm({ value, onChange }: Props<Payload>) {
  // Each branch narrows `value`; the cast just tells TS the setter matches.
  const set = <T extends Payload>(patch: Partial<T>) => onChange({ ...value, ...patch } as Payload);

  switch (value.type) {
    case "url":
      return (
        <TextInput
          label="Website URL"
          id="url"
          type="url"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          placeholder="https://example.com/contact"
          value={value.url}
          onChange={(url) => set({ url })}
          className={big}
          autoFocus
        />
      );

    case "text":
      return <TextArea label="Text" value={value.text} onChange={(text) => set({ text })} rows={4} />;

    case "wifi":
      return (
        <div className="space-y-3">
          <Grid>
            <TextInput
              label="Network name (SSID)"
              value={value.ssid}
              autoComplete="off"
              spellCheck={false}
              onChange={(ssid) => set({ ssid })}
            />
            {value.security !== "nopass" && (
              <TextInput
                label="Password"
                value={value.password}
                autoComplete="off"
                spellCheck={false}
                onChange={(password) => set({ password })}
              />
            )}
          </Grid>
          <Field label="Security">
            <Segmented
              label="Wi-Fi security"
              value={value.security}
              onChange={(security) => set({ security })}
              options={[
                { value: "WPA", label: "WPA/WPA2/WPA3" },
                { value: "WEP", label: "WEP" },
                { value: "nopass", label: "None" },
              ]}
            />
          </Field>
          <Toggle checked={value.hidden} onChange={(hidden) => set({ hidden })}>
            Hidden network
          </Toggle>
          <p className="text-xs text-muted">
            Anyone who scans this code can see the password. It&apos;s only stored in the code itself, never sent
            anywhere.
          </p>
        </div>
      );

    case "vcard":
      return (
        <div className="space-y-3">
          <Grid>
            <TextInput
              label="First name"
              value={value.firstName}
              autoComplete="given-name"
              onChange={(firstName) => set({ firstName })}
            />
            <TextInput
              label="Last name"
              value={value.lastName}
              autoComplete="family-name"
              onChange={(lastName) => set({ lastName })}
            />
            <TextInput label="Company" value={value.org} autoComplete="organization" onChange={(org) => set({ org })} />
            <TextInput
              label="Job title"
              value={value.title}
              autoComplete="organization-title"
              onChange={(title) => set({ title })}
            />
            <TextInput
              label="Phone"
              type="tel"
              value={value.phone}
              autoComplete="tel"
              onChange={(phone) => set({ phone })}
            />
            <TextInput
              label="Email"
              type="email"
              value={value.email}
              autoComplete="email"
              onChange={(email) => set({ email })}
            />
            <TextInput
              label="Website"
              type="url"
              value={value.website}
              autoComplete="url"
              onChange={(website) => set({ website })}
            />
          </Grid>
          <details className="rounded-lg border border-line px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-muted">Address & note</summary>
            <div className="mt-3 space-y-3 pb-1">
              <TextInput
                label="Street"
                value={value.street}
                autoComplete="street-address"
                onChange={(street) => set({ street })}
              />
              <Grid>
                <TextInput
                  label="City"
                  value={value.city}
                  autoComplete="address-level2"
                  onChange={(city) => set({ city })}
                />
                <TextInput
                  label="Region / county"
                  value={value.region}
                  autoComplete="address-level1"
                  onChange={(region) => set({ region })}
                />
                <TextInput
                  label="Postcode"
                  value={value.postcode}
                  autoComplete="postal-code"
                  onChange={(postcode) => set({ postcode })}
                />
                <TextInput
                  label="Country"
                  value={value.country}
                  autoComplete="country-name"
                  onChange={(country) => set({ country })}
                />
              </Grid>
              <TextArea label="Note" value={value.note} onChange={(note) => set({ note })} rows={2} />
            </div>
          </details>
          <p className="text-xs text-muted">The more you add, the denser the code. Keep it to what people need.</p>
        </div>
      );

    case "email":
      return (
        <div className="space-y-3">
          <TextInput
            label="Send to"
            type="email"
            value={value.to}
            autoComplete="email"
            onChange={(to) => set({ to })}
          />
          <TextInput label="Subject (optional)" value={value.subject} onChange={(subject) => set({ subject })} />
          <TextArea label="Message (optional)" value={value.body} onChange={(body) => set({ body })} />
        </div>
      );

    case "sms":
      return (
        <div className="space-y-3">
          <TextInput
            label="Phone number"
            type="tel"
            placeholder="+44 7700 900123"
            value={value.phone}
            onChange={(phone) => set({ phone })}
          />
          <TextArea label="Message (optional)" value={value.message} onChange={(message) => set({ message })} />
        </div>
      );

    case "phone":
      return (
        <TextInput
          label="Phone number"
          type="tel"
          placeholder="+44 20 7946 0000"
          value={value.phone}
          onChange={(phone) => set({ phone })}
          className={big}
        />
      );
  }
}
