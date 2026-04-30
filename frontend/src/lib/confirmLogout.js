import Swal from "sweetalert2";

const MANUAL_LOGOUT_FLAG = "eec:manual-logout";

export function markManualLogout() {
  sessionStorage.setItem(MANUAL_LOGOUT_FLAG, "1");
}

export function consumeManualLogoutFlag() {
  const marked = sessionStorage.getItem(MANUAL_LOGOUT_FLAG) === "1";
  if (marked) {
    sessionStorage.removeItem(MANUAL_LOGOUT_FLAG);
  }
  return marked;
}

export async function confirmLogout() {
  const result = await Swal.fire({
    title: "Do you want to logout?",
    text: "You will need to login again to continue.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Logout",
    cancelButtonText: "Stay Logged In",
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
      popup: "eec-logout-popup",
      title: "eec-logout-title",
      htmlContainer: "eec-logout-text",
      icon: "eec-logout-icon",
      actions: "eec-logout-actions",
      confirmButton: "eec-logout-confirm-btn",
      cancelButton: "eec-logout-cancel-btn",
    },
  });

  return Boolean(result.isConfirmed);
}

export async function confirmAndLogout() {
  const confirmed = await confirmLogout();
  if (!confirmed) return false;

  markManualLogout();
  localStorage.removeItem("jwt");
  localStorage.removeItem("user");
  window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "manual-logout" } }));
  return true;
}
