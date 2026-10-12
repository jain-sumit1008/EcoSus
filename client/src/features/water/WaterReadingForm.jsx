import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BLOCKS } from "../../constants/nav.js";
import * as waterApi from "../../api/water.api.js";
import { useToast } from "../../context/ToastContext.jsx";

const schema = z.object({
  block: z.enum(["A", "B", "C", "D", "E"]),
  consumptionLitres: z.coerce.number().positive(),
  recordedAt: z.string().min(1),
  meterId: z.string().optional(),
  notes: z.string().optional(),
});

export default function WaterReadingForm({ onCreated }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { block: "A", recordedAt: new Date().toISOString().slice(0, 16) },
  });

  const onSubmit = async (values) => {
    try {
      const payload = { ...values, recordedAt: new Date(values.recordedAt).toISOString() };
      const result = await waterApi.createReading(payload);
      toast.success(result.detection?.alertGenerated ? "Reading saved and an anomaly alert was generated." : "Reading saved.");
      reset();
      onCreated?.(result);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form className="card p-4" onSubmit={handleSubmit(onSubmit)}>
      <h3 className="font-semibold">Add water reading</h3>
      <p className="text-xs text-muted">Values are interval consumption in litres, not cumulative meter totals.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="block">Block</label>
          <select id="block" className="input" {...register("block")}>
            {BLOCKS.map((block) => (
              <option key={block}>{block}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="litres">Consumption (L)</label>
          <input id="litres" className="input" type="number" step="0.1" {...register("consumptionLitres")} />
          {errors.consumptionLitres ? <p className="text-xs text-error">{errors.consumptionLitres.message}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="recordedAt">Timestamp</label>
          <input id="recordedAt" className="input" type="datetime-local" {...register("recordedAt")} />
        </div>
        <div>
          <label className="label" htmlFor="meterId">Meter ID (optional)</label>
          <input id="meterId" className="input" {...register("meterId")} />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="notes">Notes</label>
          <textarea id="notes" className="input" rows="2" {...register("notes")} />
        </div>
      </div>
      <button className="btn-primary mt-4" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save reading"}
      </button>
    </form>
  );
}
