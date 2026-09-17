"use client";

import { useEffect, useRef } from "react";
import SignaturePadLibrary from "signature_pad";
import { RotateCcw } from "lucide-react";

type SignaturePadProps = {
  value?: string;
  onChange: (dataUrl: string) => void;
  error?: string;
  label?: string;
};

export function SignaturePad({
  value,
  onChange,
  error,
  label = "Instructor Signature",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLibrary | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePadLibrary(canvas, {
      minWidth: 0.8,
      maxWidth: 2.6,
      penColor: "#0b2347",
      backgroundColor: "rgba(255,255,255,0)",
    });
    padRef.current = pad;

    const resize = () => {
      const saved = pad.isEmpty()
        ? initialValueRef.current
        : pad.toDataURL("image/png");
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const bounds = canvas.getBoundingClientRect();
      canvas.width = bounds.width * ratio;
      canvas.height = bounds.height * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
      if (saved) {
        void pad.fromDataURL(saved, {
          ratio,
          width: bounds.width,
          height: bounds.height,
        });
      }
    };

    const capture = () => {
      if (!pad.isEmpty()) {
        onChangeRef.current(pad.toDataURL("image/png"));
      }
    };

    resize();
    pad.addEventListener("endStroke", capture);
    window.addEventListener("resize", resize);

    return () => {
      pad.removeEventListener("endStroke", capture);
      window.removeEventListener("resize", resize);
      pad.off();
      padRef.current = null;
    };
  }, []);

  const clear = () => {
    padRef.current?.clear();
    onChange("");
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="form-label">
          {label} <span aria-hidden="true">*</span>
        </label>
        <button className="text-button" type="button" onClick={clear}>
          <RotateCcw aria-hidden="true" size={16} />
          Clear
        </button>
      </div>
      <div
        className={`signature-frame ${error ? "border-red-600" : ""}`}
        data-testid="signature-pad"
      >
        <canvas
          ref={canvasRef}
          className="h-52 w-full touch-none cursor-crosshair"
          aria-label="Draw instructor signature"
        />
        <div className="pointer-events-none absolute inset-x-5 bottom-8 border-t border-dashed border-slate-400 text-center">
          <span className="relative -top-3 bg-white px-3 text-xs text-slate-500">
            Sign above
          </span>
        </div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
