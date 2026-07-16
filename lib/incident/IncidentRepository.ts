import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class IncidentRepository {

    static async getAll(companyId?: string) {

        let query = supabase
            .from("incidents")
            .select("*")
            .order("incident_date", {
                ascending: false,
            });

        if (companyId) {
            query = query.eq(
                "company_id",
                companyId
            );
        }

        const { data, error } =
            await query;

        if (error) throw error;

        return data ?? [];

    }

    static async getById(id: string) {

        const { data, error } =
            await supabase
                .from("incidents")
                .select("*")
                .eq("id", id)
                .single();

        if (error) throw error;

        return data;

    }

    static async create(record: any) {

        const { data, error } =
            await supabase
                .from("incidents")
                .insert(record)
                .select()
                .single();

        if (error) throw error;

        return data;

    }

    static async update(
        id: string,
        update: any
    ) {

        const { data, error } =
            await supabase
                .from("incidents")
                .update(update)
                .eq("id", id)
                .select()
                .single();

        if (error) throw error;

        return data;

    }

    static async delete(id: string) {

        const { error } =
            await supabase
                .from("incidents")
                .delete()
                .eq("id", id);

        if (error) throw error;

        return true;

    }

    static async getStatistics(
        companyId?: string
    ) {

        const incidents =
            await this.getAll(companyId);

        return {

            total:
                incidents.length,

            accidents:
                incidents.filter(
                    (x: any) =>
                        x.incident_type ===
                        "WORK_ACCIDENT"
                ).length,

            nearMiss:
                incidents.filter(
                    (x: any) =>
                        x.incident_type ===
                        "NEAR_MISS"
                ).length,

            open:
                incidents.filter(
                    (x: any) =>
                        x.status !==
                        "CLOSED"
                ).length,

            closed:
                incidents.filter(
                    (x: any) =>
                        x.status ===
                        "CLOSED"
                ).length,

        };

    }
    static async insertTimeline(record: {
  incident_id: string;
  event_code: string;
  title: string;
  description?: string;
  status: string;
  created_by?: string;
  created_at: string;
}) {
  const { data, error } = await supabase
    .from("incident_timeline")
    .insert(record)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

static async getTimeline(incidentId: string) {
  const { data, error } = await supabase
    .from("incident_timeline")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

}