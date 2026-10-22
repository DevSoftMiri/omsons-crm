import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: { period?: string; ownerId?: string; region?: string; pipeline?: string }) {
    const db = this.prisma as any;
    const now = new Date();
    const start = this.periodStart(query.period ?? "current-quarter", now);
    const end = new Date(now); end.setDate(end.getDate() + 1); end.setHours(0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const baseDeal = { pipeline: query.pipeline || undefined, ownerId: query.ownerId || undefined, company: query.region ? { regions: { has: query.region } } : undefined };
    const openDealWhere = { ...baseDeal, stage: { notIn: ["Closed Won", "Closed Lost"] } };
    const [openDeals, newLeads, newCompanies, visits, tasks, followUps, closingDeals, recentCompanies, activities] = await Promise.all([
      db.deal.findMany({ where: openDealWhere, select: { id: true, name: true, stage: true, amount: true, probability: true, closeDate: true, expectedCloseDate: true, productCategory: true, stageChangedAt: true, updatedAt: true, owner: { select: { id: true, name: true } }, company: { select: { id: true, name: true, regions: true, customerType: true } }, contact: { select: { id: true, firstName: true, lastName: true } } } }),
      db.lead.count({ where: { createdAt: { gte: start, lt: end }, ownerId: query.ownerId || undefined } }),
      db.company.count({ where: { createdAt: { gte: start, lt: end }, ownerId: query.ownerId || undefined, regions: query.region ? { has: query.region } : undefined } }),
      db.visit.count({ where: { visitedAt: { gte: start, lt: end }, userId: query.ownerId || undefined } }),
      db.task.findMany({ where: { doneAt: null, assigneeId: query.ownerId || undefined, dueAt: { not: null } }, orderBy: { dueAt: "asc" }, take: 20, include: { assignee: { select: { id: true, name: true } }, lead: { select: { id: true, title: true } } } }),
      db.followUp.findMany({ where: { completedAt: null, ownerId: query.ownerId || undefined }, orderBy: { dueAt: "asc" }, take: 20, include: { owner: { select: { id: true, name: true } }, lead: { select: { id: true, title: true } } } }),
      db.deal.findMany({ where: { ...baseDeal, stage: { notIn: ["Closed Won", "Closed Lost"] }, OR: [{ closeDate: { gte: now, lt: monthEnd } }, { expectedCloseDate: { gte: now, lt: monthEnd } }] }, orderBy: { closeDate: "asc" }, take: 10, select: { id: true, name: true, amount: true, stage: true, closeDate: true, expectedCloseDate: true, company: { select: { id: true, name: true } } } }),
      db.company.findMany({ where: { isArchived: false, ownerId: query.ownerId || undefined, regions: query.region ? { has: query.region } : undefined }, orderBy: { updatedAt: "desc" }, take: 8, select: { id: true, name: true, regions: true, customerType: true, updatedAt: true, owner: { select: { id: true, name: true } }, deals: { where: { stage: { notIn: ["Closed Won", "Closed Lost"] } }, select: { amount: true } } } }),
      db.activity.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { id: true, name: true } }, contact: { select: { id: true, firstName: true, lastName: true } }, lead: { select: { id: true, title: true } } } }),
    ]);
    const today = new Date(now); today.setHours(0, 0, 0, 0); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const overdueTasks = tasks.filter((task: any) => task.dueAt && new Date(task.dueAt) < today);
    const todayTasks = tasks.filter((task: any) => task.dueAt && new Date(task.dueAt) >= today && new Date(task.dueAt) < tomorrow);
    const pendingFollowUps = followUps.filter((item: any) => new Date(item.dueAt) >= today && new Date(item.dueAt) < tomorrow);
    const pipeline = this.groupDeals(openDeals);
    return { period: query.period ?? "current-quarter", range: { start, end }, metrics: { openPipelineValue: this.amount(openDeals), openDealCount: openDeals.length, newLeads, newCompanies, dealerVisits: visits, followUpsDueToday: pendingFollowUps.length, overdueTasks: overdueTasks.length, dealsClosingThisMonth: closingDeals.length }, pipeline, recentCompanies: recentCompanies.map((company: any) => ({ ...company, openDealValue: this.amount(company.deals) })), pendingWork: { overdueTasks, todayTasks, upcomingFollowUps: followUps.filter((item: any) => new Date(item.dueAt) >= tomorrow).slice(0, 10), closingDeals }, recentActivity: activities, insights: { byRegion: this.groupDeals(openDeals, (deal: any) => deal.company?.regions?.[0] || "Unassigned"), byCustomerType: this.groupDeals(openDeals, (deal: any) => deal.company?.customerType || "Unassigned"), byProductCategory: this.groupDeals(openDeals, (deal: any) => deal.productCategory || "Unassigned") } };
  }

  private amount(items: any[]) { return items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0); }
  private groupDeals(deals: any[], key: (deal: any) => string = (deal) => deal.stage || "Unassigned") { const groups = new Map<string, any>(); for (const deal of deals) { const name = key(deal); const group = groups.get(name) ?? { name, count: 0, amount: 0, weightedAmount: 0 }; group.count += 1; group.amount += Number(deal.amount ?? 0); group.weightedAmount += Number(deal.amount ?? 0) * (Number(deal.probability ?? 0) / 100); groups.set(name, group); } return [...groups.values()]; }
  private periodStart(period: string, now: Date) { const start = new Date(now); start.setHours(0, 0, 0, 0); if (period === "current-month") return new Date(start.getFullYear(), start.getMonth(), 1); if (period === "current-year") return new Date(start.getFullYear(), 0, 1); const quarterMonth = Math.floor(start.getMonth() / 3) * 3; return new Date(start.getFullYear(), quarterMonth, 1); }
}
