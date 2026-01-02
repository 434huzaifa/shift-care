# RRule Generator Component - Complete Guide

## 📖 Overview

The **RRuleGenerator** component is a React component that allows users to create recurring shift schedules using the **RRule** (Recurrence Rule) standard. Think of it as a "repeat scheduler" - similar to how you set recurring events in Google Calendar or Outlook.

### What is RRule?

RRule is an industry-standard format for defining recurring events. For example:
- "Every Monday and Wednesday"
- "Every 2 weeks"
- "Daily for 30 days"
- "Monthly on the 15th"

The component converts user-friendly selections (checkboxes, dropdowns) into an RRule string like:
```
RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=52;BYDAY=MO,WE
```

---

## 🎯 Purpose

This component is used in the **Shift Creation Form** to allow staff managers to:
1. Create one-time shifts (no recurrence)
2. Create recurring shifts that repeat automatically
3. See a human-readable summary of the recurrence pattern
4. Automatically calculate how many shift occurrences will be created

---

## 🔧 Component Props

```typescript
interface RRuleGeneratorProps {
  value: string;              // Current RRule string (e.g., "RRULE:FREQ=WEEKLY;...")
  onChange: (value: string) => void;  // Callback when RRule changes
  startDate: dayjs.Dayjs;     // When the shift starts
  endTime: string;            // Shift end date
  onEndTimeChange?: (endTime: string) => void;  // Callback to update end date
}
```

### Prop Explanations:

1. **`value`**: The current RRule string stored in the form. Empty string = no recurrence.

2. **`onChange`**: Function that updates the RRule in the parent form when user makes changes.

3. **`startDate`**: The shift's start date. Used to calculate:
   - How many days/weeks/months remain in the year
   - The first occurrence date
   - Maximum allowed intervals

4. **`endTime`**: The calculated end date of the last occurrence.

5. **`onEndTimeChange`**: Optional callback to automatically update the shift's end date when recurrence is calculated.

---

## 🧩 Key Concepts

### 1. **Frequency Types**

The component supports 4 frequency types:

| Frequency | Description | Example |
|-----------|-------------|---------|
| **DAILY** | Repeats every X days | Every 2 days |
| **WEEKLY** | Repeats every X weeks | Every week on Mon & Wed |
| **MONTHLY** | Repeats every X months | Every 3 months |
| **YEARLY** | Repeats every X years | Once per year |

### 2. **Interval**

The **interval** is how often the frequency repeats:
- Interval = 1: Every day/week/month/year
- Interval = 2: Every 2 days/weeks/months/years
- Interval = 3: Every 3 days/weeks/months/years

**Example:**
- Frequency = WEEKLY, Interval = 2 → "Every 2 weeks"
- Frequency = DAILY, Interval = 3 → "Every 3 days"

### 3. **End Types**

Users can choose how the recurrence ends:

#### **Never (Until end of year)**
- The shift repeats as much as possible until December 31st
- The component automatically calculates the maximum occurrences
- **Smart calculation:** Adjusts for how many days/weeks/months remain

#### **After number of occurrences**
- User manually enters how many times the shift should repeat
- Example: "Repeat 10 times"

### 4. **Weekday Selection (Weekly Only)**

When frequency is **WEEKLY**, users can select which days of the week:
- Monday through Sunday checkboxes
- Can select multiple days (e.g., Mon, Wed, Fri)
- If no days selected, defaults to the start date's weekday

---

## 🛠️ State Management

### Internal State Variables:

```typescript
const [enabled, setEnabled] = useState(false);
// Controls if recurrence is turned on or off

const [freq, setFreq] = useState<Frequency>(RRule.WEEKLY);
// Current frequency: DAILY, WEEKLY, MONTHLY, or YEARLY

const [interval, setInterval] = useState(1);
// How often to repeat (1 = every, 2 = every other, etc.)

const [count, setCount] = useState<number | undefined>(undefined);
// Number of occurrences when endType = "count"

const [byweekday, setByweekday] = useState<number[]>([]);
// Selected weekdays for WEEKLY frequency (e.g., [0, 2] = Mon, Wed)

const [endType, setEndType] = useState<"never" | "count">("never");
// How recurrence ends: "never" or "count"

const [isInitialized, setIsInitialized] = useState(false);
// Prevents infinite loops when parsing existing RRule
```

---

## 📊 Key Functions Explained

### `calculateMaxOccurrencesInYear()`

**Purpose:** Calculates how many times a shift can occur from the start date until December 31st.

**How it works:**

1. **DAILY:**
   ```typescript
   // If today is March 15, 2026 (day 74 of 365)
   daysRemaining = 365 - 74 + 1 = 292 days
   maxOccurrences = Math.ceil(292 / interval)
   // Interval = 1: 292 shifts
   // Interval = 2: 146 shifts (every other day)
   ```

2. **WEEKLY:**
   ```typescript
   // If today is March 15, 2026
   weeksRemaining = weeks until Dec 31 = 42 weeks
   maxOccurrences = Math.ceil(42 / interval)
   // If 3 weekdays selected: 42 * 3 = 126 occurrences
   ```

3. **MONTHLY:**
   ```typescript
   // If current month is March (month index 2)
   monthsRemaining = 12 - 2 = 10 months
   maxOccurrences = Math.ceil(10 / interval)
   ```

4. **YEARLY:**
   ```typescript
   // Can only occur once more this year
   return 1;
   ```

### `maxInterval` (useMemo)

**Purpose:** Prevents users from setting an interval larger than what's possible this year.

**Example:**
- If only 5 weeks remain in the year, users can't set interval to 6 weeks
- Dynamically updates when frequency changes

### `useEffect` - Parse Existing RRule

**Purpose:** When editing an existing shift, load its recurrence settings.

**How it works:**
```typescript
// Input: "RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=10;BYDAY=MO,WE"

1. Parse the RRule string using RRule.fromString()
2. Extract options (freq, interval, count, byweekday)
3. Use queueMicrotask to schedule state updates
   (Avoids React setState-in-effect error)
4. Update all state variables
5. Mark as initialized to prevent re-parsing
```

**Why `queueMicrotask`?**
- React doesn't allow synchronous `setState` inside `useEffect`
- `queueMicrotask` schedules the updates to run after the effect completes
- Prevents "cascading renders" performance issues

### `useEffect` - Auto-adjust Interval

**Purpose:** If user changes frequency and the current interval is now too large, automatically reduce it.

**Example:**
```typescript
// User had interval = 40 weeks
// User changes frequency to MONTHLY
// maxInterval for MONTHLY = 10 months
// Auto-adjust interval to 10
```

### `useEffect` - Generate RRule String

**Purpose:** Whenever settings change, generate a new RRule string and notify the parent form.

**Flow:**
```typescript
1. Check if recurrence is enabled
   → If disabled: send empty string to parent

2. Determine the count:
   → If endType = "count": use user's input
   → If endType = "never": calculate max occurrences until end of year

3. Build RRule options object:
   {
     freq: WEEKLY,
     interval: 2,
     dtstart: startDate.toDate(),
     count: 26,
     byweekday: [0, 2]  // Mon, Wed
   }

4. Calculate last occurrence date:
   → Create temporary RRule
   → Get all occurrences
   → Update parent's endTime with last occurrence

5. Generate final RRule string:
   "RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=26;BYDAY=MO,WE"

6. Send to parent via onChange()
```

**Debouncing:**
- Uses `setTimeout(100ms)` to avoid generating RRule on every keystroke
- Cleanup function cancels previous timeout

### `readableRule` (useMemo)

**Purpose:** Convert the RRule string into human-readable text.

**Example:**
```typescript
Input:  "RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=52;BYDAY=MO,WE"
Output: "every week on Monday and Wednesday"
```

Uses RRule's built-in `toText()` method.

### `occurrenceCount` (useMemo)

**Purpose:** Count how many total occurrences will be created.

**How it works:**
```typescript
1. Parse the current RRule
2. Generate all occurrences (limited to 1000 for safety)
3. Return the count
```

---

## 🎨 UI Components

### 1. **Enable/Disable Checkbox**
```tsx
<Checkbox checked={enabled} onCheckedChange={setEnabled} />
```
- Turns recurrence on/off
- When disabled, sends empty RRule string

### 2. **Frequency & Interval Selector**
```tsx
<Input type="number" value={interval} max={maxInterval} />
<Select options={[DAILY, WEEKLY, MONTHLY, YEARLY]} />
```
- Number input for interval (1, 2, 3...)
- Dropdown for frequency type
- Automatically enforces `maxInterval` limit

### 3. **Weekday Badges (Weekly Only)**
```tsx
{WEEKDAYS.map(day => (
  <Badge onClick={() => handleWeekdayToggle(day.value)}>
    {day.label}
  </Badge>
))}
```
- Shows Mon-Sun badges
- Click to toggle selection
- Highlighted badges = selected days

### 4. **End Type Selector**
```tsx
<Select options={["Never", "After occurrences"]} />
```
- Choose between "Never" and "Count"
- Shows helper text explaining "Never"

### 5. **Count Input (Conditional)**
```tsx
{endType === "count" && (
  <Input type="number" value={count} />
)}
```
- Only shown when "After occurrences" is selected
- User enters custom occurrence count

### 6. **Summary Panel**
```tsx
<div className="bg-muted">
  <p>Summary: {readableRule}</p>
  <p>Total occurrences: {occurrenceCount}</p>
</div>
```
- Shows human-readable recurrence description
- Shows total number of occurrences
- Updates in real-time

---

## 🔄 Complete User Flow Example

### Scenario: Create a shift that repeats every Monday and Wednesday until end of year

1. **User clicks "Repeat this shift" checkbox**
   - `enabled` = true
   - Component shows recurrence options

2. **User selects frequency:**
   - Dropdown: "Week(s)"
   - `freq` = RRule.WEEKLY

3. **User keeps interval at 1:**
   - `interval` = 1 (every week)

4. **User clicks Monday and Wednesday badges:**
   - `byweekday` = [0, 2]

5. **User keeps "Never (Until end of year)":**
   - `endType` = "never"

6. **Component automatically calculates:**
   - Current date: March 15, 2026
   - Weeks until Dec 31: 42 weeks
   - Days per week: 2 (Mon, Wed)
   - Total occurrences: 42 × 2 = 84 shifts

7. **Generated RRule:**
   ```
   RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=84;BYDAY=MO,WE
   ```

8. **Summary shows:**
   - "every week on Monday and Wednesday"
   - "Total occurrences: 84"

9. **Last occurrence calculated:**
   - Component finds the 84th occurrence date
   - Updates parent's `endTime` to that date

10. **Parent form receives:**
    - RRule string via `onChange()`
    - End date via `onEndTimeChange()`

---

## 🐛 Common Pitfalls & Solutions

### Problem 1: setState in Effect Error
**Error:** "Calling setState synchronously within an effect can trigger cascading renders"

**Solution:**
```typescript
// ❌ Wrong
useEffect(() => {
  setState(value);
}, [deps]);

// ✅ Correct
useEffect(() => {
  queueMicrotask(() => setState(value));
}, [deps]);
```

### Problem 2: Infinite Re-renders
**Cause:** Parsing RRule triggers state updates, which triggers re-parsing

**Solution:**
```typescript
const [isInitialized, setIsInitialized] = useState(false);

useEffect(() => {
  if (value && !isInitialized) {
    // Parse only once
    parseRRule(value);
    setIsInitialized(true);
  }
}, [value, isInitialized]);
```

### Problem 3: Interval Exceeds Maximum
**Cause:** User selects large interval, then changes frequency

**Solution:**
```typescript
useEffect(() => {
  if (interval > maxInterval) {
    queueMicrotask(() => setInterval(maxInterval));
  }
}, [freq, maxInterval, interval]);
```

---

## 📝 RRule Format Examples

### Daily (Every 2 days, 30 times)
```
RRULE:FREQ=DAILY;INTERVAL=2;COUNT=30
```

### Weekly (Every week on Mon/Wed/Fri)
```
RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=52;BYDAY=MO,WE,FR
```

### Monthly (Every 3 months)
```
RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=4
```

### Yearly (Once per year)
```
RRULE:FREQ=YEARLY;INTERVAL=1;COUNT=1
```

---

## 🔗 Integration with Shift Form

The parent component (create-shift-form.tsx) uses this component like:

```tsx
<RRuleGenerator
  value={field.state.value}
  onChange={field.handleChange}
  startDate={dayjs(form.getFieldValue("date"))}
  endTime={form.getFieldValue("end_date")}
  onEndTimeChange={(date) => form.setFieldValue("end_date", date)}
/>
```

When the form is submitted:
1. RRule string is stored in `shift.rrule_recurrence` field
2. `shift.occurrences` = occurrenceCount
3. `shift.end_date` = last occurrence date
4. Backend uses RRule to generate individual shift records

---

## 🎓 Key Takeaways

1. **RRule is a standard format** for recurring events used across many calendar applications

2. **The component hides complexity** - users see simple checkboxes and dropdowns, not RRule syntax

3. **Smart defaults** - "Never" automatically calculates until end of year based on remaining time

4. **Real-time feedback** - Users see exactly how many shifts will be created

5. **Integrates seamlessly** - Parent form just receives an RRule string and end date

6. **Prevents errors** - Auto-adjusts intervals, validates inputs, shows readable summaries

---

## 🚀 Future Enhancements

Potential improvements:
- Add "Until specific date" option (in addition to "Never" and "Count")
- Support monthly recurrence by day of month (e.g., "15th of every month")
- Add custom day selection for non-weekly frequencies
- Show calendar preview of occurrences
- Export occurrence dates as downloadable list

---

## 📚 Dependencies

- **rrule**: Standard recurrence rule library
- **dayjs**: Date manipulation and formatting
- **react-select**: Dropdown selectors
- **shadcn/ui**: Checkbox, Input, Label, Badge components

---

## 🙋 Still Confused?

Think of this component as a "smart translator":
- **You speak:** "I want shifts every Monday and Wednesday"
- **It translates to:** `RRULE:FREQ=WEEKLY;COUNT=84;BYDAY=MO,WE`
- **Database understands:** "Create 84 shifts on these weekdays"

The magic is that users never see the RRule syntax - they just click checkboxes and the component handles all the complex calculations and formatting behind the scenes!
