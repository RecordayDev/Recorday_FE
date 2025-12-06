"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthField } from "@/components/auth/AuthField";
import {
  validateEmail,
  validatePassword,
  validateNickname,
} from "@/lib/authValidation";
import { api } from "@/lib/api";
import { SocialLoginSection } from "@/components/auth/SocialLoginSection";

type SignupErrors = {
  email?: string | null;
  password?: string | null;
  passwordConfirm?: string | null;
  nickname?: string | null;
  common?: string | null;
};

const signupFields = [
  {
    id: "email",
    name: "email",
    type: "email",
    label: "이메일",
    autoComplete: "email",
    placeholder: "example@example.com",
  },
  {
    id: "nickname",
    name: "nickname",
    type: "text",
    label: "닉네임",
    autoComplete: "nickname",
    placeholder: "인생네컷에 표시될 이름",
  },
  {
    id: "password",
    name: "password",
    type: "password",
    label: "비밀번호",
    autoComplete: "new-password",
    placeholder: "8자 이상, 영문/숫자 조합 권장",
  },
  {
    id: "passwordConfirm",
    name: "passwordConfirm",
    type: "password",
    label: "비밀번호 확인",
    autoComplete: "new-password",
    placeholder: "비밀번호를 다시 입력해 주세요",
  },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const passwordConfirm = String(formData.get("passwordConfirm") || "");
    const nickname = String(formData.get("nickname") || "");

    const newErrors: SignupErrors = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }

    const nicknameError = validateNickname(nickname);
    if (nicknameError) newErrors.nickname = nicknameError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post(`/api/recorday/register`, {
        email,
        password,
        username: nickname,
      });

      alert("회원가입이 완료되었습니다. 로그인해 주세요.");
      router.push("/login");
    } catch (error) {
      console.error(error);

      const msg = "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.";

      setErrors({ common: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-zinc-950 text-white px-4 py-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-1">
          <Link
            href="/"
            className="text-[11px] font-medium tracking-[0.16em] text-zinc-500"
          >
            RECORDAY
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            Recorday 계정 만들기
          </h1>
          <p className="text-[11px] text-zinc-400">
            오늘 만든 인생네컷을 나중에도 다시 꺼내보고 싶다면
            <br />
            이메일로 간단하게 계정을 만들어 보세요.
          </p>
        </header>

        {/* 이메일 회원가입 폼 */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
        >
          {signupFields.map((field) => (
            <AuthField
              key={field.id}
              id={field.id}
              name={field.name}
              type={field.type}
              label={field.label}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              required
              error={errors[field.name as keyof SignupErrors]}
            />
          ))}

          {errors.common && (
            <p className="text-[10px] text-red-400">{errors.common}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 inline-flex h-9 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {isSubmitting ? "가입 중..." : "이메일로 회원가입"}
          </button>
        </form>

        {/* 소셜 회원가입 */}
        <SocialLoginSection mode="signup" />

        <p className="text-center text-[11px] text-zinc-400">
          이미 계정이 있다면{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-400 underline underline-offset-4"
          >
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
