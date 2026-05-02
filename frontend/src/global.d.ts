import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      /* Buttons */
      // Elevated Buttons
      "md-elevated-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;

      // Filled Buttons
      "md-filled-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?:string };

      // Filled Tonal Buttons
      "md-filled-tonal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;

      // Outlined Buttons
      "md-outlined-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;

      // Text Buttons
      "md-text-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;



      /* Chips */
      // Chip Set
      "md-chip-set": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;

      // Assist Chip
      "md-assist-chip": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { label?: string };

      // Filer Chip
      "md-filter-chip": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { label?: string };

      // Input Chip
      "md-input-chip": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { label?: string };

      // Suggestion Chip
      "md-suggestion-chip": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { label?: string };



      /* Lists */
      // List Body
      "md-list": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;

      // List Item
      "md-list-item": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { type?:string };



      /* Select */
      // Outlined Select
      "md-outlined-select": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { label?: string }
        & { class?:string  }
        & { value?: string };

      // Filled Select
      "md-filled-select": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { label?: string } & { value?: string };

      // Select Option
      "md-select-option": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { value?:string };



      /* Dialogs */
      "md-dialog": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { open?: boolean };



      /* Icons */
      "md-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { filled?: boolean };


      /* Icon Buttons */
      // Icon Buttons
      "md-icon-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;

      // Filed Icon Button
      "md-filled-icon-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;

      // Filled Tonal Icon Button
      "md-filled-tonal-icon-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;


      /* Text Fields */
      // Filled Text Fields
      "md-filled-text-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { label?: string }
        & { type ?: string }
        & { value?: string }
        & { rows ?: string }
        & { step ?: string }
        & { readOnly?: boolean }
        & { disabled?: boolean };

      // Outlined Text Fields
      "md-outlined-text-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { label?: string }
        & { type ?: string }
        & { value?: string }
        & { rows ?: string }
        & { step ?: string }
        & { readOnly?: boolean }
        & { class?:string }
        & { textarea?: boolean }
        & { disabled?: boolean };

      "md-checkbox": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { checked?: boolean }
        & { onChange?: (e: any) => void }
        & { disabled?: boolean};
    }
  }
}
