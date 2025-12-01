
// <CHANGE> Helper function to properly insert template content
export const useReminderTemplate = (
  richTextRef: React.RefObject<any>,
  contractForm: any,
  onContractChange: (field: string, value: any) => void
) => {
  const handleAddReminderTemplate = () => {
    console.log("[v0] Template button clicked");
    
    const generatedNote = `<b>Reminder Name:</b> ${
      contractForm.reminderName
    }<br><b>Account Number:</b> ${
      contractForm.accountNumber
    }<br><b>Payment Amount:</b> ${
      contractForm.paymentAmount
    }<br><b>Payment Interval:</b> ${
      contractForm.paymentInterval || ""
    }<br><b>Expiration Date:</b> ${
      contractForm.expirationDate
        ? contractForm.expirationDate.toISOString().split("T")[0]
        : ""
    }<br><b>Category:</b> ${contractForm.category}<br><b>Description:</b> ${
      contractForm.description
    }<br><b>Website / Email:</b> ${
      contractForm.emailWebsite
    }<br><b>Phone Number:</b> ${
      contractForm.phone
    }<br><b>Non-Renew Sent Date:</b> ${
      contractForm.nonRenewDate
        ? contractForm.nonRenewDate.toISOString().split("T")[0]
        : ""
    }<br>`;

    const templatePattern = /<b>Reminder Name:<\/b>[\s\S]*?(<br><br>|$)/;
    const hasExistingTemplate = templatePattern.test(contractForm.notes);

    const updatedNotes = hasExistingTemplate
      ? contractForm.notes.replace(templatePattern, generatedNote)
      : contractForm.notes
      ? generatedNote + "<br><br>" + contractForm.notes
      : generatedNote;

    console.log("[v0] Updated notes:", updatedNotes);
    
    // <CHANGE> Update state first (this is the source of truth)
    onContractChange("notes", updatedNotes);

    // <CHANGE> Then update the ref if the component supports it
    if (richTextRef.current) {
      // Try multiple methods to set content
      if (typeof richTextRef.current.setContentHTML === "function") {
        richTextRef.current.setContentHTML(updatedNotes);
      } else if (typeof richTextRef.current.setHTML === "function") {
        richTextRef.current.setHTML(updatedNotes);
      } else if (typeof richTextRef.current.setContent === "function") {
        richTextRef.current.setContent(updatedNotes);
      }
      // If none of the above work, the state update via onContractChange should handle it
    }
  };

  return { handleAddReminderTemplate };
};
