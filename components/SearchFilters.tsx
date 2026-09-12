import Form from "next/form";
import { Search } from "lucide-react";

import type { RepositorySearchParamsInput } from "@/lib/validation";

const DIFFICULTIES = [
  { value: "BEGINNER", label: "Beginner friendly" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const SORTS = [
  { value: "stars", label: "Most stars" },
  { value: "trending", label: "Trending" },
  { value: "recent-updated", label: "Recently updated" },
  { value: "recent-added", label: "Recently added" },
];

const SearchFilters = ({
  values,
  languages,
  technologies,
  licenses,
}: {
  values: RepositorySearchParamsInput;
  languages: string[];
  technologies: string[];
  licenses: string[];
}) => {
  return (
    <Form action="/search" scroll={false} className="space-y-5">
      <div className="search-form !mt-0">
        <input
          name="query"
          defaultValue={values.query}
          className="search-input"
          placeholder="Search repositories, owners, or topics"
        />
        <button type="submit" className="search-btn text-white">
          <Search className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <select name="language" defaultValue={values.language ?? ""} className="repo-form_input !mt-0 !py-2.5 text-sm">
          <option value="">All languages</option>
          {languages.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>

        <select
          name="technology"
          defaultValue={values.technology ?? ""}
          className="repo-form_input !mt-0 !py-2.5 text-sm"
        >
          <option value="">All technologies</option>
          {technologies.map((technology) => (
            <option key={technology} value={technology}>
              {technology}
            </option>
          ))}
        </select>

        <select name="license" defaultValue={values.license ?? ""} className="repo-form_input !mt-0 !py-2.5 text-sm">
          <option value="">All licenses</option>
          {licenses.map((license) => (
            <option key={license} value={license}>
              {license}
            </option>
          ))}
        </select>

        <select
          name="difficulty"
          defaultValue={values.difficulty ?? ""}
          className="repo-form_input !mt-0 !py-2.5 text-sm"
        >
          <option value="">Any difficulty</option>
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        <input
          name="topic"
          defaultValue={values.topic}
          placeholder="Topic"
          className="repo-form_input !mt-0 !py-2.5 text-sm"
        />

        <select name="sort" defaultValue={values.sort ?? "stars"} className="repo-form_input !mt-0 !py-2.5 text-sm">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <input
          name="org"
          defaultValue={values.org}
          placeholder="Organization login"
          className="repo-form_input !mt-0 !py-2.5 text-sm"
        />
        <input
          name="developer"
          defaultValue={values.developer}
          placeholder="Developer username"
          className="repo-form_input !mt-0 !py-2.5 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="featured"
            value="true"
            defaultChecked={values.featured}
            className="size-4 rounded border-input"
          />
          Featured only
        </label>
      </div>
    </Form>
  );
};

export default SearchFilters;
