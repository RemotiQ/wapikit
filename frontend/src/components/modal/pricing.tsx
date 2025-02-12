'use client'

import { clsx } from 'clsx'
import { useCallback, useEffect, useState } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select'
import {
	PlanValidityEnum,
	PricingPlanTierEnum,
	type PricingPlan,
	useGetPaymentPlans,
	useCheckoutPayment,
	type CurrencyEnum
} from '~/cloud_generated'
import { Modal } from '~/components/ui/modal'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { Icons } from '../icons'
import { useLayoutStore } from '~/store/layout.store'
import { listStringEnumMembers } from 'ts-enum-utils'
import Link from 'next/link'
import {
	createHref,
	displayRazorpayCheckoutModal,
	errorNotification,
	successNotification
} from '~/reusable-functions'
import { WEBSITE_URL } from '~/constants'
import { useRouter } from 'next/navigation'

export function PricingModal() {
	const { isPricingModalOpen, writeProperty } = useLayoutStore()
	const router = useRouter()

	const [currentScalePlan, setCurrentScalePlan] = useState<'basic' | 'plus' | 'max'>('basic')
	const [currentValidity, setCurrentValidity] = useState<PlanValidityEnum>(
		PlanValidityEnum.Monthly
	)

	const { data: pricingPlans, isFetched } = useGetPaymentPlans({
		currency: 'USD'
	})

	const checkout = useCheckoutPayment()

	const highlightedFeatures = [
		{
			plan: PricingPlanTierEnum.Pro,
			features: [
				'10K Contacts',
				'5 Active Campaigns',
				'3 Org Members',
				'AI Automation',
				'API Access'
			]
		},
		{
			plan: PricingPlanTierEnum.Scale,
			features: [
				'30K Contacts',
				'10 Active Campaigns',
				'8 Org Members',
				'AI Automation',
				'API Access'
			]
		},
		{
			plan: PricingPlanTierEnum.ScalePlus,
			features: [
				'100K Contacts',
				'Unlimited Active Campaigns',
				'15 Org Members',
				'AI Automation',
				'API Access'
			]
		},
		{
			plan: PricingPlanTierEnum.ScaleMax,
			features: [
				'250K Contacts',
				'Unlimited Active Campaigns',
				'30 Org Members',
				// 'All Premium Integrations',
				'AI Automation',
				'API Access'
			]
		}
	]

	const getFilteredPricingPlans = useCallback(
		(plans: PricingPlan[]) => {
			return plans
				.filter(plan => plan.validity === currentValidity)
				.filter(plan => {
					if (plan.tier === PricingPlanTierEnum.Pro) {
						return true
					}

					if (currentScalePlan === 'basic') {
						return plan.tier === PricingPlanTierEnum.Scale
					} else if (currentScalePlan === 'plus') {
						return plan.tier === PricingPlanTierEnum.ScalePlus
					} else if (currentScalePlan === 'max') {
						return plan.tier === PricingPlanTierEnum.ScaleMax
					}
				})
		},
		[currentScalePlan, currentValidity]
	)

	const [plansToRender, setPlansToRender] = useState<PricingPlan[]>(() => {
		return getFilteredPricingPlans(pricingPlans?.plans || [])
	})

	useEffect(() => {
		setPlansToRender(() => getFilteredPricingPlans(pricingPlans?.plans || []))
	}, [currentValidity, currentScalePlan, pricingPlans, getFilteredPricingPlans])

	useEffect(() => {
		if (isFetched && pricingPlans) {
			const planPriority = [
				PricingPlanTierEnum.Scale,
				PricingPlanTierEnum.ScalePlus,
				PricingPlanTierEnum.ScaleMax
			]

			const nextPlan = planPriority.find(plan => {
				const matchedPlan = pricingPlans.plans?.find(p => p.tier === plan)
				return !matchedPlan?.shouldCtaBeDisabled
			})

			console.log({ nextPlan })

			if (nextPlan) {
				// Map the plan names to the currentScalePlan values
				const planMapping = {
					[PricingPlanTierEnum.Scale]: 'basic',
					[PricingPlanTierEnum.ScalePlus]: 'plus',
					[PricingPlanTierEnum.ScaleMax]: 'max'
				}

				setCurrentScalePlan(planMapping[nextPlan] as any)
			}
		}
	}, [isFetched, pricingPlans])

	function OnSuccessfulPayment(token: string): void {
		successNotification({
			message: 'Payment successful. Redirecting to verification page...'
		})
		router.push(`/verify-payment?token=${token}`)
	}

	async function checkoutInit(planId: string, currency: CurrencyEnum) {
		try {
			writeProperty({
				isPricingModalOpen: false
			})

			successNotification({
				message: 'Please wait while we process your payment...',
				duration: '10s'
			})

			const response = await checkout.mutateAsync({
				params: {
					planId,
					currency
				}
			})

			if (response.razorpaySessionId) {
				const plan = plansToRender.find(plan => plan.uniqueId === planId)

				if (!plan) {
					errorNotification({
						message: 'An error occurred while checking out. Please try again later.'
					})
					return
				}

				await displayRazorpayCheckoutModal({
					plan: plan,
					userDetails: {
						name: 'Sarthak',
						email: 'contact@softlancer.co',
						phone: '1234567890'
					},
					isAnUpgrade: false,
					sessionId: response.razorpaySessionId,
					verificationToken: response.verificationToken,
					onSuccess: OnSuccessfulPayment
				})
			} else {
				errorNotification({
					message: 'An error occurred while checking out. Please try again later.'
				})
			}
		} catch (error) {
			console.error('error checking out', error)
			errorNotification({
				message: 'An error occurred while checking out. Please try again later.'
			})
		}
	}

	return (
		<Modal
			title=""
			description=""
			isDismissible={true}
			onClose={() => {
				writeProperty({ isPricingModalOpen: false })
			}}
			isOpen={isPricingModalOpen}
			className="!max-w-[75%]"
		>
			<div className="relative flex h-full w-full flex-col items-center justify-center gap-4  bg-grid-small-black/[0.2]">
				<Beam />
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
				<div className="relative z-10 flex flex-col items-center justify-center gap-2 text-center">
					<h6 className="text-2xl font-semibold text-black md:text-3xl">
						Upgrade your plan
					</h6>
				</div>

				<Tabs
					defaultValue="monthly"
					className="relative z-10 mx-auto rounded-md border border-neutral-200 bg-white"
				>
					<TabsList className="flex w-full items-center justify-start gap-2">
						{listStringEnumMembers(PlanValidityEnum).map(({ value: planDuration }) => (
							<TabsTrigger
								key={planDuration}
								value={planDuration}
								onClick={() => {
									setCurrentValidity(() => planDuration as PlanValidityEnum)
								}}
								className={clsx(
									'cursor-pointer !text-xs',
									currentValidity === planDuration
										? 'text-primary-500 bg-neutral-200'
										: 'text-black'
								)}
							>
								Pay {planDuration}{' '}
								{planDuration === 'Yearly' && (
									<span className="ml-1.5 rounded-3xl bg-black px-1.5 py-0.5 text-[10px] text-white">
										Save 15%
									</span>
								)}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				<div className="relative z-10 mt-4 w-full max-w-[56%]">
					{' '}
					<div className="relative mx-auto flex flex-col items-start justify-start gap-x-5 gap-y-4 lg:grid lg:grid-cols-2">
						{plansToRender.map(plan => (
							<div
								className={clsx(
									'group relative flex h-full w-full flex-col items-start justify-start gap-y-4 rounded-lg p-5',
									plan.isPopular ? 'bg-neutral-50' : 'bg-white shadow'
								)}
								key={plan.title}
							>
								{plan.tier === PricingPlanTierEnum.Scale ||
								plan.tier === PricingPlanTierEnum.ScaleMax ||
								plan.tier === PricingPlanTierEnum.ScalePlus ? (
									<div className="pointer-events-none absolute bottom-0 left-0 right-0 top-0 rounded-lg bg-[linear-gradient(to_bottom,#00AA45,white,transparent)] opacity-15" />
								) : null}
								{plan.tier === PricingPlanTierEnum.Free ||
								plan.tier === PricingPlanTierEnum.Enterprise ||
								plan.tier === PricingPlanTierEnum.Pro ? (
									<h3 className="mr-auto w-fit py-1 font-sans text-lg font-medium leading-none text-black">
										{plan.title}
									</h3>
								) : (
									<div className="relative z-20 flex w-full items-start justify-between">
										<div>
											{' '}
											<Select
												onValueChange={e => {
													setCurrentScalePlan(
														() => e as 'basic' | 'plus' | 'max'
													)
												}}
												value={currentScalePlan}
											>
												<SelectTrigger className="mr-auto w-fit rounded-md ">
													<SelectValue>
														{currentScalePlan === 'basic'
															? 'Scale'
															: currentScalePlan === 'plus'
																? 'Scale Plus'
																: 'Scale Max'}
													</SelectValue>
												</SelectTrigger>
												<SelectContent className="bg-white">
													<SelectItem value="basic">Basic</SelectItem>
													<SelectItem value="plus">Plus</SelectItem>
													<SelectItem value="max">Max</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="rounded-2xl bg-black px-2.5 py-1 text-xs font-normal text-white">
											Best value
										</div>
									</div>
								)}

								{/* price of the plan */}

								<div className="mr-auto mt-3 flex flex-row items-end justify-start gap-1 text-3xl font-semibold text-black">
									<span>{plan.priceString}</span>

									{[
										PricingPlanTierEnum.Free,
										PricingPlanTierEnum.Enterprise
									].includes(
										plan.tier as unknown as 'Free' | 'Enterprise'
									) ? null : (
										<span className="text-secondary-500  text-xs font-normal">
											per month
										</span>
									)}
								</div>

								<div className="relative mt-3 flex h-full w-full flex-col items-start  justify-start gap-5 overflow-hidden ">
									<div className="flex flex-col items-start justify-start">
										<ul
											role="list"
											className="flex flex-col items-start justify-start gap-2"
										>
											{highlightedFeatures
												.find(feats => feats.plan === plan.tier)
												?.features.map(feature => (
													<li
														key={feature}
														className="flex items-center gap-1.5"
													>
														<div className="flex-shrink-0">
															<Icons.checkCircle
																className="h-4 w-4 font-bold text-green-500"
																aria-hidden="true"
															/>
														</div>
														<p className="text-secondary-600 text-left text-sm font-medium tracking-tight">
															{feature}
														</p>
													</li>
												))}
										</ul>
									</div>

									<div className="mt-5 w-full">
										<Button
											size="lg"
											className="w-full"
											variant={plan.isPopular ? 'default' : 'secondary'}
											disabled={plan.shouldCtaBeDisabled}
											onClick={() => {
												checkoutInit(plan.uniqueId, plan.currency).catch(
													error => console.error(error)
												)
											}}
										>
											{plan.ctaText}
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="relative z-10">
					<Link
						href={createHref({
							href: '/contact-us',
							domain: WEBSITE_URL,
							utmParams: {
								utm_source: 'pricing-modal',
								utm_content: 'contact-us',
								utm_medium: 'app-modal'
							}
						})}
					>
						<Button
							variant={'text'}
							className="text-secondary-500 text-sm font-medium underline"
						>
							Looking for Enterprise ?
						</Button>
					</Link>
				</div>
			</div>
		</Modal>
	)
}

export const Beam = () => {
	return (
		<svg
			width="156"
			height="63"
			viewBox="0 0 156 63"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="absolute right-0 top-20 mr-24 mt-8"
		>
			<path
				d="M31 .5h32M0 .5h32m30 31h32m-1 0h32m-1 31h32M62.5 32V0m62 63V31"
				stroke="url(#grad1)"
				strokeWidth={1.5}
			/>
			<defs>
				<motion.linearGradient
					variants={{
						initial: {
							x1: '40%',
							x2: '50%',
							y1: '160%',
							y2: '180%'
						},
						animate: {
							x1: '0%',
							x2: '10%',
							y1: '-40%',
							y2: '-20%'
						}
					}}
					animate="animate"
					initial="initial"
					transition={{
						duration: 1.8,
						repeat: Infinity,
						repeatType: 'loop',
						ease: 'linear',
						repeatDelay: 2
					}}
					id="grad1"
				>
					<stop stopColor="#00aa45" stopOpacity="0" />
					<stop stopColor="#00aa45" />
					<stop offset="0.325" stopColor="#6344F5" />
					<stop offset="1" stopColor="#AE48FF" stopOpacity="0" />
				</motion.linearGradient>
			</defs>
		</svg>
	)
}
export default PricingModal
