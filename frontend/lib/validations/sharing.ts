import * as z from "zod";

export const shareFileSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Recipient email is required" })
    .email({ message: "Please enter a valid email address." }),
  permission: z.enum(["VIEW", "EDIT"], {
    errorMap: () => ({ message: "Please select either VIEW or EDIT permission." }),
  }),
});

export type ShareFileFormValues = z.infer<typeof shareFileSchema>;
