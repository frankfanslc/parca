import {useState} from 'react';
import DatePicker from 'react-datepicker';
import {AbsoluteDate, DateTimeRange, getDateHoursAgo} from '../../utils';
import Button from 'components/ui/Button';

import 'react-datepicker/dist/react-datepicker.css';

interface AbsoluteDatePickerProps {
  range: DateTimeRange;
  onChange?: (from: AbsoluteDate, to: AbsoluteDate) => void;
}

const ReactDateTimePicker = ({selected, onChange}) => (
  <DatePicker
    selected={selected}
    onChange={onChange}
    showTimeInput
    dateFormat="MMMM d, yyyy h:mm aa"
    className="text-sm w-48 p-2 rounded-md  bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600"
  />
);

const AbsoluteDatePicker = ({range, onChange = () => null}: AbsoluteDatePickerProps) => {
  const [from, setFrom] = useState<Date>(
    range.from.isRelative() ? getDateHoursAgo(1) : (range.from as AbsoluteDate).value
  );
  const [to, setTo] = useState<Date>(
    range.to.isRelative() ? getDateHoursAgo(0) : (range.to as AbsoluteDate).value
  );
  return (
    <div className="p-4">
      <div className="mb-2 hidden">
        <span className="uppercase text-xs">Absolute Range</span>
      </div>
      <div className="flex flex-col justify-center">
        <div className="mb-2">
          <div className="mb-2">
            <span className="uppercase text-xs">From:</span>
          </div>
          <ReactDateTimePicker selected={from} onChange={date => setFrom(date)} />
        </div>
        <div className="mb-1">
          <div className="mb-2">
            <span className="uppercase text-xs">To:</span>
          </div>
          <ReactDateTimePicker selected={to} onChange={date => setTo(date)} />
        </div>
      </div>
      <div className="w-32 mx-auto mt-4">
        <Button
          onClick={() => {
            onChange(new AbsoluteDate(from), new AbsoluteDate(to));
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

export default AbsoluteDatePicker;
