/**
 * Utility functions for form handling
 */

/**
 * Format a select option with name and email
 */
export const formatSelectOption = <T extends { id: number; name: string; email: string }>(
  item: T
) => ({
  value: item.id,
  label: `${item.name} (${item.email})`,
});

/**
 * Find and format the selected value for a react-select dropdown
 */
export const getSelectedValue = <T extends { id: number; name: string; email: string }>(
  list: T[],
  selectedId: number | undefined
) => {
  if (!selectedId) return null;
  const selected = list.find((item) => item.id === selectedId);
  return selected ? formatSelectOption(selected) : null;
};
