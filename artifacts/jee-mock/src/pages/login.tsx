import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSendOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const phoneSchema = z.object({
  phone: z.string().min(10, "Phone number must be 10 digits"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export default function Login() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onPhoneSubmit = (data: z.infer<typeof phoneSchema>) => {
    setPhone(data.phone);
    sendOtpMutation.mutate(
      { data: { phone: data.phone } },
      {
        onSuccess: (res: any) => {
          if (res.otp) setDevOtp(res.otp);
          setStep("otp");
        },
      }
    );
  };

  const onOtpSubmit = (data: z.infer<typeof otpSchema>) => {
    verifyOtpMutation.mutate(
      { data: { phone, otp: data.otp } },
      {
        onSuccess: (res) => {
          login(res.token, res.user);
          setLocation("/dashboard");
        },
      }
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">J</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === "phone" ? "Welcome to JEE Mock" : "Verify OTP"}
          </CardTitle>
          <CardDescription>
            {step === "phone"
              ? "Enter your phone number to continue"
              : `Enter the 6-digit code sent to +91 ${phone}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                            +91
                          </span>
                          <Input
                            className="rounded-l-none"
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                {devOtp && (
                  <div className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-center">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                      Dev Mode — Your OTP
                    </p>
                    <p className="text-3xl font-mono font-bold tracking-widest text-amber-900">
                      {devOtp}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      (In production this is sent via SMS)
                    </p>
                    <button
                      type="button"
                      className="mt-2 text-xs text-blue-600 underline"
                      onClick={() => otpForm.setValue("otp", devOtp)}
                    >
                      Click to auto-fill
                    </button>
                  </div>
                )}

                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormLabel className="mb-2">Enter 6-digit OTP</FormLabel>
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifyOtpMutation.isPending}
                >
                  {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Login"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setStep("phone"); setDevOtp(null); }}
                >
                  ← Back
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
