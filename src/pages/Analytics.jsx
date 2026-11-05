import { useState } from 'react'
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Lightbulb, TrendingDown, TrendingUp } from 'lucide-react'
import { EmptyState, MonthPicker, PageHeader } from '../components'
import { useSpendly } from '../context'
import { cashFlowData, categoryTotals, CURRENCIES, getBudget, getTotals, money, monthKey, monthLabel, shiftMonth } from '../lib/finance'

export default function Analytics() {
  const { transactions, profile, sampleData } = useSpendly()
  const [month, setMonth] = useState(monthKey())
  const totals = getTotals(transactions, month)
  const categories = categoryTotals(transactions, month)
  const budget = getBudget(totals.expenses, profile.budget)
  const previousMonth = shiftMonth(month, -1)
  const previous = getTotals(transactions, previousMonth).expenses
  const change = previous > 0 ? Math.round((totals.expenses - previous) / previous * 100) : null
  const chartData = cashFlowData(transactions, month)
  const sixMonthIncome = chartData.reduce((sum, item) => sum + Math.round(item.income * 100), 0) / 100
  const sixMonthExpenses = chartData.reduce((sum, item) => sum + Math.round(item.expenses * 100), 0) / 100

  return (
    <div className="analytics-page">
      <PageHeader title="Analytics" subtitle={`Your spending at a glance${sampleData ? ' · Sample data' : ''}`} />
      <MonthPicker month={month} onChange={setMonth} />
      <section className="spending-banner"><div><span>Total spending</span><strong>{money(totals.expenses, profile.currency)}</strong></div><span className="budget-pill">{profile.budget > 0 ? `${budget.percentage}% of budget` : 'Budget not set'}</span></section>
      <section className="income-analytics-summary" aria-label="Monthly cash flow">
        <div className="card"><span>Income this month</span><strong className="monthly-income">{money(totals.income, profile.currency)}</strong></div>
        <div className="card"><span>Net cash flow</span><strong className="monthly-net">{money(totals.balance, profile.currency)}</strong><small>Income − expenses</small></div>
      </section>
      <div className="analytics-grid">
        <section className="card category-chart-card">
          <h2>Spending by category</h2>
          {totals.expenses > 0 ? <div className="category-chart-content">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart accessibilityLayer>
                  <Pie data={categories.filter((item) => item.value > 0)} dataKey="value" nameKey="label" innerRadius="72%" outerRadius="98%" paddingAngle={1.5} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                    {categories.filter((item) => item.value > 0).map((item) => <Cell key={item.id} fill={item.color} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [money(value, profile.currency), name]} contentStyle={{ borderRadius: 12, border: '1px solid #EDE7FF', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><strong>{money(totals.expenses, profile.currency, totals.expenses % 1 ? 2 : 0)}</strong><span>this month</span></div>
            </div>
            <div className="chart-legend">{categories.map((item) => <div className={`legend-item ${!item.value ? 'legend-zero' : ''}`} key={item.id}><span className="legend-dot" style={{ background: item.color }} /><div><strong>{item.label}</strong><small>{money(item.value, profile.currency)} · {Math.round(item.value / totals.expenses * 100)}%</small></div></div>)}</div>
          </div> : <EmptyState title="Your picture starts here" message="Add an expense for this month to see where your money goes." />}
        </section>
        <section className="card monthly-chart-card cash-flow-chart">
          <div className="section-heading"><h2>Income & spending <span>({CURRENCIES[profile.currency]})</span></h2><span className="chart-period">6 MONTHS</span></div>
          <div className="bar-chart-wrap">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} margin={{ top: 12, right: 0, left: 0, bottom: 0 }} accessibilityLayer>
                <XAxis dataKey="name" axisLine={{ stroke: '#EDE7FF' }} tickLine={false} tick={{ fill: '#89859F', fontSize: 11 }} dy={4} />
                <Tooltip cursor={{ fill: '#FAF9FF' }} formatter={(value, name) => [money(value, profile.currency), name]} contentStyle={{ borderRadius: 12, border: '1px solid #EDE7FF', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 12 }} />
                <Bar dataKey="income" name="Income" fill="#6C4DFF" radius={[5, 5, 2, 2]} maxBarSize={24} isAnimationActive={false} />
                <Bar dataKey="expenses" name="Expenses" fill="#FFB58D" radius={[5, 5, 2, 2]} maxBarSize={24} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <dl className="cash-flow-totals"><div><dt>6-month income</dt><dd>{money(sixMonthIncome, profile.currency)}</dd></div><div><dt>6-month expenses</dt><dd>{money(sixMonthExpenses, profile.currency)}</dd></div></dl>
        </section>
      </div>
      <section className="analytics-insight"><span className="insight-symbol">{change === null ? <Lightbulb size={22} /> : change > 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}</span><div><strong>Monthly insight{sampleData ? ' · Sample data' : ''}</strong><p>{change === null ? totals.expenses > 0 ? 'A fresh start! Keep tracking to discover your spending patterns.' : 'Every transaction tells a story. Add one to start seeing yours.' : change === 0 ? `Spending is the same as ${monthLabel(previousMonth, { month: 'long' })}.` : `Spending is ${Math.abs(change)}% ${change > 0 ? 'higher' : 'lower'} than ${monthLabel(previousMonth, { month: 'long' })}.`}</p></div></section>
      <p className="list-footnote">Calculated from your transactions. Your initial balance is excluded from income and cash flow.</p>
    </div>
  )
}
