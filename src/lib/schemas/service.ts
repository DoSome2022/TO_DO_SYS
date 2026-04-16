import z from "zod";

export const serviceformSchema = z.object({
  name: z.string(),
  type: z.string(),
  price: z.number().min(0, "價錢不得為負"), // 👈 拔除 coerce
});
