import { z } from "zod";

export const GetBodyMeasurementsSchema = z
  .object({
    accessToken: z.string().openapi({ example: "your_access_token_here" }),
  })
  .openapi("GetBodyMeasurementsSchema");

export const BodyMeasurementSchema = z
  .object({
    height_meter: z.number().openapi({ example: 1.8288 }),
    weight_kilogram: z.number().openapi({ example: 90.7185 }),
    max_heart_rate: z.number().int().openapi({ example: 200 }),
  })
  .openapi("BodyMeasurementSchema");

export const BodyMeasurementsResponseSchema = z
  .object({
    data: BodyMeasurementSchema,
  })
  .openapi("BodyMeasurementsResponseSchema");

export const CreateBodyMeasurementSchema = z
  .object({
    accessToken: z.string().openapi({ example: "your_access_token_here" }),
    height_meter: z.number().optional().openapi({ example: 1.8288 }),
    weight_kilogram: z.number().optional().openapi({ example: 90.7185 }),
    max_heart_rate: z.number().int().optional().openapi({ example: 200 }),
  })
  .openapi("CreateBodyMeasurementSchema");
