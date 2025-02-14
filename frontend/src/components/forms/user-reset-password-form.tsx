'use client'
import { Button } from '~/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useResetPasswordComplete, useResetPasswordInit, useResetPasswordVerify } from '~/generated'
import { errorNotification, successNotification } from '~/reusable-functions'
import { useRouter } from 'next/navigation'

const otpFormSchema = z.object({
	otp: z.string().length(6, { message: 'OTP must be 6 characters' })
})

const confirmEmailFormSchema = z.object({
	email: z.string().email({ message: 'Enter a valid email address' })
})

const resetPasswordFormSchema = z.object({
	password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
	confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' })
})

type ConfirmEmailValue = z.infer<typeof confirmEmailFormSchema>
type ResetPasswordFormValue = z.infer<typeof resetPasswordFormSchema>
type OtpFormValue = z.infer<typeof otpFormSchema>

export default function UserResetPasswordForm() {
	const router = useRouter()

	const [isBusy, setIsBusy] = useState(false)
	const [activeForm, setActiveForm] = useState<
		'confirmEmailForm' | 'otpForm' | 'resetpasswordForm'
	>('confirmEmailForm')

	const defaultValues = {
		email: ''
	}

	const confirmEmailForm = useForm<ConfirmEmailValue>({
		resolver: zodResolver(confirmEmailFormSchema),
		defaultValues
	})

	const otpForm = useForm<OtpFormValue>({
		resolver: zodResolver(otpFormSchema),
		defaultValues: {
			otp: ''
		}
	})

	const resetPasswordForm = useForm<ResetPasswordFormValue>({
		resolver: zodResolver(resetPasswordFormSchema),
		defaultValues: {
			password: '',
			confirmPassword: ''
		}
	})

	const resetPasswordInit = useResetPasswordInit()
	const resetPasswordVerify = useResetPasswordVerify()
	const resetPasswordComplete = useResetPasswordComplete()

	async function ConfirmEmail(data: ConfirmEmailValue) {
		try {
			if (isBusy) {
				return
			}
			setIsBusy(true)

			if (!data.email) {
				errorNotification({
					message: 'Email is required'
				})
				return
			}

			const response = await resetPasswordInit.mutateAsync({
				data: {
					email: data.email
				}
			})

			if (response.isOtpSent) {
				// open the otp form
				setActiveForm(() => 'otpForm')
				successNotification({
					message:
						'You must has received an email with OTP, if the email belongs to one of a user.'
				})
			}
		} catch (error) {
			console.error(error)
			errorNotification({
				message: 'Something went wrong'
			})
		} finally {
			setIsBusy(false)
		}
	}

	async function submitOtp(data: OtpFormValue) {
		try {
			if (isBusy) {
				return
			}
			setIsBusy(true)

			const userData = confirmEmailForm.getValues()

			const response = await resetPasswordVerify.mutateAsync({
				data: {
					email: userData.email,
					otp: data.otp
				}
			})

			if (response.isVerified) {
				successNotification({
					message: 'OTP verified successfully'
				})
				setActiveForm(() => 'resetpasswordForm')
			} else {
				// something went wrong show error token not found
				errorNotification({
					message: 'Something went wrong'
				})
			}
		} catch (error) {
			console.error(error)
			errorNotification({
				message: (error as any).error
			})
		} finally {
			setIsBusy(false)
		}
	}

	async function resetPassword(data: ResetPasswordFormValue) {
		try {
			console.log('reset password')
			console.log({ data })
			if (isBusy) return
			setIsBusy(true)

			const userData = confirmEmailForm.getValues()
			if (data.password !== data.confirmPassword) {
				errorNotification({
					message: 'Passwords do not match'
				})
				return
			}

			const response = await resetPasswordComplete.mutateAsync({
				data: {
					email: userData.email,
					password: data.password
				}
			})

			if (response.isPasswordReset) {
				successNotification({
					message: 'Password reset successfully'
				})
				router.push('/signin')
			} else {
				errorNotification({
					message: 'Something went wrong'
				})
			}
		} catch (error) {
			console.error(error)
			errorNotification({
				message: 'Something went wrong'
			})
		} finally {
			setIsBusy(false)
		}
	}

	return (
		<>
			{activeForm === 'confirmEmailForm' ? (
				<Form {...confirmEmailForm}>
					<div className="flex flex-col justify-center space-y-6">
						<p className="text-sm font-normal text-muted-foreground">
							We will send an email with verification code.
						</p>
						<form
							onSubmit={confirmEmailForm.handleSubmit(ConfirmEmail)}
							className="flex w-full flex-col gap-1"
							id="registration-details-form"
						>
							<FormField
								control={confirmEmailForm.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="you@youremail.com"
												disabled={isBusy}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button disabled={isBusy} className="ml-auto mt-2 w-full" type="submit">
								Next
							</Button>
							<Button
								onClick={e => {
									e.preventDefault()
									router.push('/signin')
								}}
								variant={'link'}
							>
								Go Back
							</Button>
						</form>
					</div>
				</Form>
			) : activeForm === 'otpForm' ? (
				<Form {...otpForm}>
					<p className="text-sm font-normal text-muted-foreground">
						We send an email with verification code. Please check your spam folder as
						well.
					</p>
					<form
						onSubmit={otpForm.handleSubmit(submitOtp)}
						className="flex w-full flex-col gap-2 space-y-2"
						id="otp-form"
					>
						<FormField
							control={otpForm.control}
							name="otp"
							key={'otp_field'}
							render={({ field }) => (
								<FormItem>
									<FormLabel>OTP</FormLabel>
									<FormControl>
										<Input
											id="otp"
											placeholder="enter otp"
											disabled={isBusy}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button disabled={isBusy} className="ml-auto w-full" type="submit">
							Next
						</Button>
					</form>
				</Form>
			) : (
				<Form {...resetPasswordForm}>
					<p className="text-sm font-normal text-muted-foreground">Set New password.</p>
					<form
						onSubmit={resetPasswordForm.handleSubmit(resetPassword)}
						className="flex w-full flex-col gap-2"
						id="reset-password-complete-form"
					>
						<FormField
							control={resetPasswordForm.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="At least 6 characters"
											disabled={isBusy}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={resetPasswordForm.control}
							name="confirmPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirm Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="confirm your password"
											disabled={isBusy}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button disabled={isBusy} className="ml-auto mt-2 w-full" type="submit">
							Set New Password
						</Button>
					</form>
				</Form>
			)}
		</>
	)
}
