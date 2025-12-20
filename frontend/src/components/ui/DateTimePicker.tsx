import { forwardRef } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import { ru } from "date-fns/locale";

interface DateTimePickerProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  disabled?: boolean;
  showTimeSelect?: boolean;
  placeholder?: string;
}

const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ value, onChange, disabled = false, showTimeSelect = true, placeholder = "Выберите дату" }) => {
    const selectedDate = value ? new Date(value) : null;

    return (
      <div className="relative">
        <ReactDatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => {
            onChange(date ? date.toISOString() : undefined);
          }}
          showTimeSelect={showTimeSelect}
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat={showTimeSelect ? "dd.MM.yyyy HH:mm" : "dd.MM.yyyy"}
          locale={ru}
          disabled={disabled}
          placeholderText={placeholder}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
          wrapperClassName="w-full"
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    );
  }
);

DateTimePicker.displayName = "DateTimePicker";

export { DateTimePicker };
