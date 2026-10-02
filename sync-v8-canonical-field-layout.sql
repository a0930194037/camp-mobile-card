-- Camp sync v8: one-time canonical field-layout migration.
--
-- Why this exists:
-- Early v8 clients stored object values in one field such as ["value"].
-- Later clients correctly write leaf fields such as ["value","defaultLevel"].
-- The sync RPC rejects mixing those paths because their conflict ordering is
-- ambiguous. Convert existing object fields to leaves once, while preserving
-- their revision and command ID, so old queued commands can be safely rebased.
-- Run this in the Supabase SQL editor after deploying the accompanying client.

begin;

create or replace function public.camp_v8_expand_field(
  p_path jsonb,
  p_value jsonb,
  p_meta jsonb
) returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  item record;
  result jsonb := '{}'::jsonb;
  leaf jsonb;
begin
  -- Arrays are application values, never field-path containers. Empty objects
  -- stay as one field so an intentional empty setting is not lost.
  if jsonb_typeof(p_value) <> 'object' or p_value = '{}'::jsonb then
    leaf := jsonb_build_object(
      'path', p_path,
      'value', p_value,
      'deleted', coalesce((p_meta->>'deleted')::boolean, false),
      'revision', p_meta->'revision',
      'commandId', p_meta->'commandId'
    );
    return jsonb_build_object(p_path::text, leaf);
  end if;

  for item in select key, value from jsonb_each(p_value) loop
    result := result || public.camp_v8_expand_field(
      p_path || jsonb_build_array(item.key), item.value, p_meta
    );
  end loop;
  return result;
end;
$$;

create or replace function public.camp_v8_canonical_fields(p_fields jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  item record;
  result jsonb := '{}'::jsonb;
begin
  for item in select key, value from jsonb_each(coalesce(p_fields, '{}'::jsonb)) loop
    if coalesce((item.value->>'deleted')::boolean, false) = false
       and jsonb_typeof(item.value->'value') = 'object' then
      result := result || public.camp_v8_expand_field(item.value->'path', item.value->'value', item.value);
    else
      result := result || jsonb_build_object(item.key, item.value);
    end if;
  end loop;
  return result;
end;
$$;

update public.camp_v8_entities
set fields = public.camp_v8_canonical_fields(fields),
    updated_at = clock_timestamp()
where exists (
  select 1 from jsonb_each(fields) field
  where coalesce((field.value->>'deleted')::boolean, false) = false
    and jsonb_typeof(field.value->'value') = 'object'
);

drop function public.camp_v8_canonical_fields(jsonb);
drop function public.camp_v8_expand_field(jsonb, jsonb, jsonb);

commit;
