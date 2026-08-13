import ChangePasswordForm from "./ChangePasswordForm";

/**
 * Settings page — lets any signed-in user change their password at any time.
 * `onPasswordChanged` refreshes the stored user (e.g. clears the first-login
 * flag) after a successful change.
 */
function SettingsPage({ user, onPasswordChanged }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-1.5 text-[13px]/[20px] text-ink-muted">
          <span>Settings</span>
        </div>
        <h1 className="text-[22px]/[30px] font-semibold tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-1 text-[14px]/[22px] text-ink-soft">
          Signed in as {user?.fullName} ({user?.role})
        </p>
      </div>

      <ChangePasswordForm
        onSuccess={onPasswordChanged}
        title="Change password"
        subtitle="Update the password you use to sign in to the FASYL PMO portal."
      />
    </div>
  );
}

export default SettingsPage;
