import Form from "next/form";
import { Search } from "lucide-react";

import SearchFormReset from "@/components/SearchFormReset";

const SearchForm = ({ query }: { query?: string }) => {
  return (
    <Form action="/search" scroll={false} className="search-form">
      <input
        name="query"
        defaultValue={query}
        className="search-input"
        placeholder="Search repositories, owners, or topics"
      />
      <div className="flex gap-4">
        {query && <SearchFormReset />}
        <button type="submit" className="search-btn text-white">
          <Search className="size-5" />
        </button>
      </div>
    </Form>
  );
};
export default SearchForm;
