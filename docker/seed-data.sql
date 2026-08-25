--
-- PostgreSQL database dump
--

\restrict wRFmIUvCTh1IsQApKTSZGNdHCsTCsUBSghDOhrhwfr4YQDdd2qDYg82O6WllApa

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.equipments DROP CONSTRAINT IF EXISTS "equipments_appointmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS "chat_messages_conversationId_fkey";
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS "appointments_technicianId_fkey";
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS "appointments_serviceId_fkey";
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS "appointments_clientId_fkey";
DROP INDEX IF EXISTS public.users_username_key;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.site_images_slot_key;
DROP INDEX IF EXISTS public."services_name_equipmentType_key";
DROP INDEX IF EXISTS public.service_category_options_slug_key;
DROP INDEX IF EXISTS public.equipment_type_options_slug_key;
DROP INDEX IF EXISTS public."chat_messages_conversationId_idx";
DROP INDEX IF EXISTS public."chat_leads_createdAt_idx";
DROP INDEX IF EXISTS public."chat_conversations_startedAt_idx";
DROP INDEX IF EXISTS public."chat_conversations_sessionId_key";
DROP INDEX IF EXISTS public."chat_conversations_ipHash_idx";
DROP INDEX IF EXISTS public."appointments_technicianId_idx";
DROP INDEX IF EXISTS public."appointments_serviceId_idx";
DROP INDEX IF EXISTS public."appointments_clientId_idx";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.ticker_messages DROP CONSTRAINT IF EXISTS ticker_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.site_images DROP CONSTRAINT IF EXISTS site_images_pkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_pkey;
ALTER TABLE IF EXISTS ONLY public.service_category_options DROP CONSTRAINT IF EXISTS service_category_options_pkey;
ALTER TABLE IF EXISTS ONLY public.equipments DROP CONSTRAINT IF EXISTS equipments_pkey;
ALTER TABLE IF EXISTS ONLY public.equipment_type_options DROP CONSTRAINT IF EXISTS equipment_type_options_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_settings DROP CONSTRAINT IF EXISTS chat_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_leads DROP CONSTRAINT IF EXISTS chat_leads_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_pkey;
ALTER TABLE IF EXISTS ONLY public.carousel_images DROP CONSTRAINT IF EXISTS carousel_images_pkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.ticker_messages;
DROP TABLE IF EXISTS public.site_images;
DROP TABLE IF EXISTS public.settings;
DROP TABLE IF EXISTS public.services;
DROP TABLE IF EXISTS public.service_category_options;
DROP TABLE IF EXISTS public.equipments;
DROP TABLE IF EXISTS public.equipment_type_options;
DROP TABLE IF EXISTS public.chat_settings;
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.chat_leads;
DROP TABLE IF EXISTS public.chat_conversations;
DROP TABLE IF EXISTS public.carousel_images;
DROP TABLE IF EXISTS public.appointments;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."AppointmentStatus";
--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'CLIENT',
    'TECHNICIAN',
    'ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id text NOT NULL,
    "clientId" text NOT NULL,
    status public."AppointmentStatus" DEFAULT 'PENDING'::public."AppointmentStatus" NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "technicianId" text,
    "priceUsd" double precision,
    address text,
    latitude double precision,
    longitude double precision,
    "serviceId" text
);


--
-- Name: carousel_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carousel_images (
    id text NOT NULL,
    filename text NOT NULL,
    "mimeType" text NOT NULL,
    alt text DEFAULT ''::text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    width integer,
    height integer,
    "sizeBytes" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "ipHash" text NOT NULL,
    "leadId" text,
    "wasConverted" boolean DEFAULT false NOT NULL,
    "messageCount" integer DEFAULT 0 NOT NULL,
    "estimatedCostUsd" numeric(10,6) DEFAULT 0 NOT NULL,
    "lastMessageAt" timestamp(3) without time zone,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "operatorActive" boolean DEFAULT false NOT NULL,
    "operatorName" text,
    status text DEFAULT 'active'::text NOT NULL,
    "unreadByAdmin" integer DEFAULT 0 NOT NULL,
    paused boolean DEFAULT false NOT NULL,
    blocked boolean DEFAULT false NOT NULL,
    "imageCount" integer DEFAULT 0 NOT NULL,
    archived boolean DEFAULT false NOT NULL
);


--
-- Name: chat_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_leads (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    "serviceInterest" text,
    message text,
    source text DEFAULT 'chat'::text NOT NULL,
    "ipHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) without time zone
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    "tokensIn" integer,
    "tokensOut" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type text DEFAULT 'text'::text NOT NULL,
    "imageUrl" text
);


--
-- Name: chat_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_settings (
    key text NOT NULL,
    value jsonb NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: equipment_type_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_type_options (
    id text NOT NULL,
    slug text NOT NULL,
    label text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text,
    "imageFilename" text
);


--
-- Name: equipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipments (
    id text NOT NULL,
    "appointmentId" text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    "serialNumber" text,
    "btuCapacity" integer,
    "failureDescription" text NOT NULL
);


--
-- Name: service_category_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_category_options (
    id text NOT NULL,
    slug text NOT NULL,
    label text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    "equipmentType" text NOT NULL,
    "priceUsd" double precision NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: site_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_images (
    id text NOT NULL,
    slot text NOT NULL,
    filename text NOT NULL,
    "mimeType" text NOT NULL,
    width integer,
    height integer,
    "sizeBytes" integer,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ticker_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticker_messages (
    id text NOT NULL,
    text text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    role public."Role" DEFAULT 'CLIENT'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verificationCode" text,
    cedula text,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    specialty text,
    username text
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a17b7e7d-e01d-4b1c-b53a-c6e8396e525d	27ad29e103e83894af666e99d2153dbe63b4905ef3741cf4dbdf24540b012650	2026-08-22 21:55:22.327222+02	20260822190000_add_carousel_images	\N	\N	2026-08-22 21:55:22.234761+02	1
53b443e3-152a-4c74-a5ac-58480fdae542	528e6ade661e3e60e8db6adadfbc50d2092d5a08b2d7c07bf60a7a6e5094b6c3	2026-06-23 21:31:32.042019+02	20260607191243_inicial	\N	\N	2026-06-23 21:31:31.891005+02	1
9e1284c8-8eab-4885-9024-7c4e390faf6e	74c88d04e759686a9add6980543bce83f4728af24da3bf3ef2123fa1490bf3ec	2026-06-23 21:31:32.063981+02	20260607191716_agregar_verificacion_usuario	\N	\N	2026-06-23 21:31:32.045672+02	1
be3ffa64-095f-4642-bc9f-1cf83fcec2e1	d8b04299bbee7d2dde7ad13682e767207583c4574a6ab76114be5e1425c48d80	2026-08-25 21:34:37.431415+02	20260825193100_add_image_to_equipment_type	\N	\N	2026-08-25 21:34:37.407082+02	1
77e34a5c-8fc1-4fa8-9926-4cd56446a531	16cf1ec674513870b648cf79d59ecd333e92cd60e7b9f0ff8e713880ae243bcf	2026-07-17 23:39:50.721768+02	20260717233942_add_technician_to_appointment	\N	\N	2026-07-17 23:39:50.628598+02	1
24bba7b6-1257-478d-9f92-d19b2a46c625	1b6a5e5f34e1ebaa294d168a572a98f2344cdebd5e1750eee8f1ee05d86ba3c4	2026-08-22 22:27:22.128509+02	20260822200000_add_live_chat_fields	\N	\N	2026-08-22 22:27:22.081328+02	1
e0938254-8716-4d59-90d0-ca1607c8b20c	2c3370a8411f19cb581350d9870d6135bd9c3a05f38cfee36a5e60eebc4f98cb	2026-07-19 00:09:08.468237+02	20260719000858_add_settings	\N	\N	2026-07-19 00:09:08.161181+02	1
f89f08cc-98ce-4a70-9e50-f9b8d8b277b8	16df01651d9646ca9308d2253bbb027ab8b333a017f9e460a0c214a31a9ad06d	2026-07-19 00:51:10.213907+02	20260719005106_add_price_to_appointment	\N	\N	2026-07-19 00:51:10.165692+02	1
e2f819e2-8fd4-4f9d-98f4-bdbd0670e526	50952baa873b1a04a1fd176d8122aea7e45d26007afff4ebe478d910190b1dcf	2026-07-19 07:07:22.359048+02	20260719070719_add_cedula_to_user	\N	\N	2026-07-19 07:07:22.328505+02	1
048ed85b-36c4-4733-b872-633de26b999b	c1a43c039b39b771aa03f400d14be7d7fd9609488f8913b08ae34422feefcfd5	2026-08-22 23:33:23.23706+02	20260822213000_add_image_and_moderation	\N	\N	2026-08-22 23:33:23.196083+02	1
e6e1e0e7-fc7d-4864-94b1-8b44187840ea	a7500f82e8c14091b1c4df9435f2cdf0108273824e537d38dff328886fd36866	2026-07-19 08:11:51.095748+02	20260719081147_add_reset_token	\N	\N	2026-07-19 08:11:51.0729+02	1
d27e684f-758e-4647-8045-925a4d3dc4ab	c840f0a0c3661f6085fba17aca0099fd42f731b173d6459ad29ce02df0a9f206	2026-08-14 18:01:31.190631+02	20260814155902_add_location_to_appointment		\N	2026-08-14 18:01:31.190631+02	0
7fa153f8-bfbb-486a-9d6c-b8ac1e787319	15362f5225090a4a9173cf1bc7c0ba29be5306062ed069877c904e3168e263c1	2026-08-15 17:15:56.47729+02	20260815152000_add_specialty_to_user	\N	\N	2026-08-15 17:15:56.433348+02	1
45d58da9-0fbb-431c-bf95-d61af3796570	66b0caa0d97419710d725568c527f8f885641355ebf782243a0f5418b2686173	2026-08-17 20:44:11.7153+02	20260817183900_add_service_table	\N	\N	2026-08-17 20:44:11.58958+02	1
70976595-0d05-4db9-93ef-7874dfbb6b26	3ee97511b809c8cea7a98c1b81ccbdea37c8992b398d3078a68ea203706ae1f1	2026-08-23 06:39:39.821947+02	20260823010000_add_archived_field	\N	\N	2026-08-23 06:39:39.78736+02	1
218a91e2-cec2-459a-8c02-3f67bf9cca39	1ea69af16d47e5b3165ce5668163bb6ee4c6c4e179f3e6c115bfbacfda87395a	2026-08-17 21:21:00.930727+02	20260817192000_add_site_image_table	\N	\N	2026-08-17 21:21:00.870568+02	1
93d6c03e-370d-4ef6-8c5c-4bab5d4b5cce	3d94bdbb1ec3a1a9cbb41b434c773f54533bf2b9a2509bf2755ccbb47fa94d27	2026-08-17 21:48:23.934818+02	20260817195000_add_username_to_user	\N	\N	2026-08-17 21:48:23.903601+02	1
1f4120ca-5ac9-4d20-8996-ae575526af98	7431b8457bbc6cf6e2f96b8e83f9a06a1e1ae53d47cb7c0ab48af0f002852d66	2026-08-21 19:56:39.862616+02	20260821180000_add_chatbot_copito	\N	\N	2026-08-21 19:56:39.740991+02	1
5cdc40d6-c16d-4e74-b217-0b282d182ce0	927c411c3dd3b2ac80a727ef8a84a86f2c64fed3c3fcb5b3807cfcccdd0dd34a	2026-08-25 01:49:27.93352+02	20260824200000_add_read_at_to_chat_lead	\N	\N	2026-08-25 01:49:27.89344+02	1
ef5118c6-3d17-4c98-8892-910b25eed11b	536ccd7fd0ad8a10ac1e4fd9c96972d9f386aeee64500e7053cd25a884b511ef	2026-08-25 03:13:06.225201+02	20260825010000_dynamic_categories_and_equipment	\N	\N	2026-08-25 03:13:06.076671+02	1
c29c327a-0fb0-42ca-8c4d-f7e084db6af9	d35db45386d7bd4c3f75a9e46a0259250b48e3517b09daf18f78296661883ebe	2026-08-25 04:51:04.4922+02	20260825020000_add_ticker_messages	\N	\N	2026-08-25 04:51:04.455854+02	1
c602a278-1620-42e9-8dec-fb82b3ee1865	c9be2e88386189f64a33b694c3f3079cd9ec3d120c8d413e1f279a15b210a9e7	2026-08-25 20:47:06.855184+02	20260825153000_add_description_to_equipment_type	\N	\N	2026-08-25 20:47:06.818086+02	1
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointments (id, "clientId", status, "scheduledAt", notes, "createdAt", "updatedAt", "technicianId", "priceUsd", address, latitude, longitude, "serviceId") FROM stdin;
54fe2bc0-f70c-412f-8895-f2e973d491fc	b554b392-2041-4484-893d-4a69bf748d3b	COMPLETED	2026-05-07 06:30:00	Vibración excesiva en la unidad externa	2026-05-07 06:30:00	2026-07-19 05:52:05.024	fa88df8e-27f3-4347-875e-0b8dafb49947	\N	\N	\N	\N	\N
3296c407-5f55-44a9-9b6d-7b3fd93fb458	b554b392-2041-4484-893d-4a69bf748d3b	COMPLETED	2026-06-22 13:30:00	El control remoto no responde, no enciende	2026-06-22 13:30:00	2026-07-19 05:52:24.257	fa88df8e-27f3-4347-875e-0b8dafb49947	\N	\N	\N	\N	\N
034f74b4-9004-467b-b928-f43a2c21ef33	09009e1c-55a6-4909-acf6-34c4b8d139a8	ASSIGNED	2026-08-26 05:02:51.785	Reparar una fuga\nDirección: La morera	2026-08-25 05:02:51.807	2026-08-25 05:03:17.897	ea331c9b-6416-4765-8ceb-bdd9e7ad760f	50	La morera	\N	\N	e29427e0-fbc8-45ba-bc55-7c008d28fd42
6ee30703-99ee-4a20-931c-c81a869311f5	590a5d96-59d4-49e1-a40a-21cacda48438	CANCELLED	2026-04-25 06:00:00	Vibración excesiva en la unidad externa	2026-04-25 06:00:00	2026-06-23 22:18:48.517	\N	\N	\N	\N	\N	\N
9d8c1369-bda2-49ae-a7a0-c6d2276a6bf2	a7dbe934-8fc1-45da-a98a-742972d50d8a	COMPLETED	2026-08-20 09:00:00	Cédula: V-17352958\nWhatsApp: +58 414-2737152\nDirección: San Juan de los morros\nHorario: manana	2026-08-17 19:29:29.702	2026-08-17 19:38:03.5	ea331c9b-6416-4765-8ceb-bdd9e7ad760f	20	Avenida 1 (Banco Obrero), Urb. Romulo Gallegos (Banco Obrero), Urbanización Rómulo Gallegos, San Juan de Los Morros, Parroquia San Juan, Municipio Roscio, Estado Guárico, Venezuela	9.918463969836944	-67.37468719482423	a1b2c3d4-e5f6-4a10-8b01-000000000001
31162192-d917-415e-a61e-15972411054d	68fcb84b-9298-4fb6-8f53-1d872097f56f	COMPLETED	2026-08-17 09:00:00	Cédula: V-24565522\nWhatsApp: +58 424-3290664\nDirección: Boleita Norte calle Vargas edificio telesur\nHorario: manana	2026-08-15 19:29:43.407	2026-08-17 18:56:21.614	fa88df8e-27f3-4347-875e-0b8dafb49947	150	DGCIM de Boleita, Calle Vargas, Boleíta Norte, Sector Boleíta Norte, Caracas, Parroquia Leoncio Martínez, Municipio Sucre, Distrito Metropolitano de Caracas, Estado Miranda, 1071, Venezuela	10.5012172	-66.8189332	\N
fa458213-3d33-4399-8021-42c002d58c2f	5db6ed86-1079-4f83-9e0a-d07ed4771c5f	COMPLETED	2026-08-16 09:00:00	Cédula: V-16363973\nWhatsApp: +58 424-1551081\nDirección: Antonio Miguel Martinez \nHorario: manana	2026-08-15 18:59:17.565	2026-08-17 18:56:46.269	fa88df8e-27f3-4347-875e-0b8dafb49947	40	\N	\N	\N	\N
8a3f2ac5-c3ed-4191-9766-2ae53a9cafb8	aaa055ca-af98-4687-9f18-299dcb5ab973	COMPLETED	2026-08-15 14:00:00	Cédula: V-21336646\nWhatsApp: +58 412-7788493\nDirección: Calle Cajigal, La Bombona, Barrio Brisas del Valle, Centro, San Juan de Los Morros, Parroquia San Juan, Municipio Roscio, Estado Guárico, 2301, Venezuela\nHorario: tarde	2026-08-15 21:08:07.645	2026-08-17 18:58:06.986	ea331c9b-6416-4765-8ceb-bdd9e7ad760f	40	Calle Licenciado Sanoja, La Bombona, Barrio Brisas del Valle, Centro, San Juan de Los Morros, Parroquia San Juan, Municipio Roscio, Estado Guárico, 2301, Venezuela	9.905581676342283	-67.36832157981144	\N
96e4bed8-5548-4af9-94db-e0911a71dcf6	590a5d96-59d4-49e1-a40a-21cacda48438	COMPLETED	2026-05-20 10:30:00	Hace ruido fuerte al encender, revisar compresor	2026-05-20 10:30:00	2026-07-18 19:40:24.584	fa88df8e-27f3-4347-875e-0b8dafb49947	\N	\N	\N	\N	\N
768bfd09-c257-4152-953f-f6f5e0f8d3c1	68fcb84b-9298-4fb6-8f53-1d872097f56f	COMPLETED	2026-08-21 14:00:00	Cédula: V-24565522\nWhatsApp: +58 424-3290664\nDirección: Boleita Norte calle Vargas edificio telesur\nHorario: tarde	2026-08-21 01:46:22.944	2026-08-24 01:52:53.14	ea331c9b-6416-4765-8ceb-bdd9e7ad760f	20	DGCIM de Boleita, Calle Vargas, Boleíta Norte, Sector Boleíta Norte, Caracas, Parroquia Leoncio Martínez, Municipio Sucre, Distrito Metropolitano de Caracas, Estado Miranda, 1071, Venezuela	10.5010147	-66.8187552	a1b2c3d4-e5f6-4a10-8b01-000000000001
b5d29003-0e98-470b-b66e-a3c1fe079211	8c9364eb-eb3b-4e72-ab68-6d8923c058c1	COMPLETED	2026-08-22 09:00:00	Cédula: V-17978764\nWhatsApp: +58 414-1462378\nDirección: Los laureles, calle Girardot N43, sector los llanos \nHorario: manana	2026-08-18 03:28:26.283	2026-08-21 14:19:17.769	ea331c9b-6416-4765-8ceb-bdd9e7ad760f	20	Camoruquito, San Juan de Los Morros, Parroquia San Juan, Municipio Roscio, Estado Guárico, Venezuela	9.8900743	-67.3613583	a1b2c3d4-e5f6-4a10-8b01-000000000001
7bbfb85c-6b10-44df-82cb-01299ca9fc2c	84632d9a-7384-4f3b-9b23-ee5eb7864ce5	COMPLETED	2026-08-27 18:00:00	Cédula: V-15712097\nWhatsApp: +58 412-2643831\nDirección: Urb. Pariapan, bloque 7. \nHorario: noche	2026-08-17 23:50:36.874	2026-08-21 14:19:48.134	ea331c9b-6416-4765-8ceb-bdd9e7ad760f	30	Urbanizacion Bella Vista, Urbanización Rómulo Gallegos, San Juan de Los Morros, Parroquia San Juan, Municipio Roscio, Estado Guárico, Venezuela	9.9165287	-67.378795	a1b2c3d4-e5f6-4a10-8b01-000000000004
0af37668-9044-4f62-b988-39080b4d45be	5f3a5249-6eeb-4fcb-b3f3-8d0f9021d3d4	COMPLETED	2026-08-17 09:00:00	Cédula: V-16364428\nWhatsApp: +58 412-8987654\nDirección: Avenida Bolívar, Urbanización Doña Elvira, Centro, URB. DOÑAEVA, San Juan de Los Morros, Parroquia San Juan, Municipio Roscio, Estado Guárico, Venezuela\nHorario: manana	2026-08-17 19:43:16.12	2026-08-21 14:20:22.055	ea331c9b-6416-4765-8ceb-bdd9e7ad760f	20	Calle Infante, Centro, URB. DOÑAEVA, San Juan de Los Morros, Parroquia San Juan, Municipio Roscio, Estado Guárico, Venezuela	9.908466033882204	-67.35942006111146	a1b2c3d4-e5f6-4a10-8b01-000000000001
d8d2adf4-e44a-4de6-9798-9b3a5a037c54	71bc3e9d-fd01-4a2d-bb35-54b89f3a30c4	COMPLETED	2026-07-18 14:00:00	Cédula: V-17062670\nWhatsApp: +58 424-1585328\nDirección: Los Rosales\nHorario: tarde	2026-07-18 04:47:46.833	2026-07-19 04:08:50.966	fa88df8e-27f3-4347-875e-0b8dafb49947	\N	\N	\N	\N	\N
\.


--
-- Data for Name: carousel_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carousel_images (id, filename, "mimeType", alt, "position", active, width, height, "sizeBytes", "createdAt", "updatedAt") FROM stdin;
86beaa90-2d1e-40c8-9c1b-4fdd8c71411a	diagnostico1.jpeg	image/jpeg	Diagnóstico eléctrico con multímetro	0	t	\N	\N	862107	2026-08-22 19:55:32.153	2026-08-22 19:55:32.153
5a4fb890-ff9e-416e-90b8-18575bf09799	spl1.jpeg	image/jpeg	Instalación de split	2	f	\N	\N	684418	2026-08-22 19:55:32.179	2026-08-22 19:59:03.77
70d90b89-62c6-4f01-9d54-07f2d4085b87	diagnostico2.jpeg	image/jpeg	Revisión de componentes	1	f	\N	\N	807706	2026-08-22 19:55:32.168	2026-08-22 20:02:24.154
9e6f3b15-df29-46f4-9475-6fc58bdd3611	tone1.jpeg	image/jpeg	Mantenimiento de equipo por toneladas	5	t	\N	\N	849318	2026-08-22 19:55:32.227	2026-08-25 19:58:59.142
c2b1e0fa-faa2-4dd3-a600-7f6113cf2ff2	split-mejor.jpeg	image/jpeg	Servicio de split completo	4	f	\N	\N	718937	2026-08-22 19:55:32.213	2026-08-25 19:59:20.649
3cb2131e-2c39-4d75-b2e0-1c4bc812ca31	carousel-1787690578015.jpg	image/jpeg		8	t	1200	896	825052	2026-08-25 20:42:58.026	2026-08-25 20:42:58.026
fae662b0-d046-497c-b0d4-ab19492b4d35	ventana2.jpeg	image/jpeg	Técnico en aires de ventana	7	t	\N	\N	775182	2026-08-22 19:55:32.248	2026-08-25 20:43:50.723
\.


--
-- Data for Name: chat_conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_conversations (id, "sessionId", "ipHash", "leadId", "wasConverted", "messageCount", "estimatedCostUsd", "lastMessageAt", "startedAt", "operatorActive", "operatorName", status, "unreadByAdmin", paused, blocked, "imageCount", archived) FROM stdin;
587d09f2-f843-46d3-9f90-275559c010de	9bca2df5-0784-4bbc-87fe-df357ae7b325	ip_eoe0m7	\N	f	8	0.000215	2026-08-23 19:51:56.255	2026-08-23 19:45:39.986	t	Admin	closed	3	f	t	1	f
da650529-8067-44af-b7e6-a0f3a4e3bf11	8f1713df-530f-419f-a901-e6de4aa77fd6	ip_eoe0m7	\N	f	13	0.000996	2026-08-23 20:21:02.143	2026-08-23 20:02:25.893	f	\N	active	2	t	f	1	t
00c261b2-5f32-4c27-ae35-cbdb3a34a863	bf288a89-37c6-45b1-add0-047d5b8906c9	ip_9pzwvd	\N	f	8	0.000446	2026-08-23 19:05:00.204	2026-08-23 19:03:07.268	t	Admin	active	1	f	f	1	f
9096ca41-b0fe-4695-a8c1-8de50bdeaa4f	03acc4a4-ea1a-4265-9657-54af0c669071	ip_78vrl2	\N	f	7	0.000213	2026-08-23 19:03:25.874	2026-08-23 18:53:57.926	t	Admin	active	3	f	f	1	f
fe733295-8751-4504-8dfa-996b85a53e53	96e39e1c-a33f-4a56-842a-7c43ddb3e822	ip_y9cl24	\N	f	4	0.000921	2026-08-25 19:27:58.554	2026-08-25 19:26:19.067	f	\N	active	2	f	f	0	f
1f1ae9ea-22c2-4e69-897c-21f2f0c51bf7	c6705f9a-8887-42ba-ae48-52ee0adde495	ip_eoe0m7	\N	f	6	0.001173	2026-08-25 17:52:28.867	2026-08-25 17:51:13.958	f	\N	active	3	f	f	0	f
ab04903b-9e37-4532-88ce-35ae3346b46e	9ff72db9-9ac0-4ad0-a988-7e91965cc69c	ip_eoe0m7	11d18bd6-f46b-4a82-bbed-9be8ca802669	t	18	0.002680	2026-08-25 00:10:08.322	2026-08-24 23:53:30.094	t	Admin	active	0	f	f	0	f
d393d240-bb6d-4d61-9bd7-03cc84cd3935	6723fb8b-6551-40b9-9009-d6ac4355eaaf	ip_eoe0m7	d03ff0c8-952f-4cdc-93be-b959f6c6bd2f	t	10	0.001432	2026-08-24 23:18:29.014	2026-08-24 23:17:01.76	f	\N	active	5	f	f	0	f
55ec3653-3af5-4655-9f20-d80ec0c78445	bc78126d-d6cd-457e-84f4-e70c257084bf	ip_eoe0m7	\N	f	2	0.000224	2026-08-25 17:53:04.098	2026-08-25 17:53:02.687	f	\N	active	1	f	f	0	f
c353e23b-67d6-4288-854a-b02ca6e8ba46	41996632-abb2-42cc-9b29-ab52ee54fb4c	ip_p2wk0c	\N	f	13	0.002093	2026-08-25 19:52:58.43	2026-08-25 19:50:44.215	t	Admin	active	0	f	f	0	f
dfd1bb2b-941d-4b23-8b20-50a07d861063	1ef5caed-badf-498c-a922-28ccf3d86f53	ip_eoe0m7	\N	f	2	0.000642	2026-08-25 18:03:29.21	2026-08-25 18:03:26.172	f	\N	active	1	f	f	0	f
7881d0d0-b1c4-45c0-8393-ebeb8056c4f8	7f91b121-80fc-418b-8fc2-36b03cf52743	ip_eoe0m7	\N	f	5	0.000215	2026-08-23 04:35:05.88	2026-08-23 04:33:53.437	t	Operador	active	3	t	f	2	t
97be8f84-fec6-46ed-ab9c-dc86b5447067	470e626e-859c-4d48-9975-436af7571978	ip_eoe0m7	\N	f	2	0.000647	2026-08-25 18:12:36.959	2026-08-25 18:12:33.819	f	\N	active	1	f	f	0	f
99411e58-72e9-43ca-9dc6-0003ed80110b	770e2d1c-44c3-4b19-890f-4e92253add1d	ip_eoe0m7	\N	f	9	0.000228	2026-08-25 05:02:51.83	2026-08-25 05:00:31.61	t	Admin	active	2	f	f	1	f
712b08cd-c6e0-42e2-8ca3-17b6e6440a3f	b00d7f0c-94f0-467b-b10e-97d0718b8565	ip_eoe0m7	\N	f	7	0.000215	2026-08-24 18:47:25.374	2026-08-24 18:44:18.952	t	Admin	active	0	f	f	0	f
7f33aa6f-35f3-4029-88db-04f7549ce3d0	55ed4b6c-a446-422e-9e3b-199da6ce6a94	ip_gi2q3x	\N	f	2	0.000236	2026-08-25 18:28:15.785	2026-08-25 18:28:14.26	f	\N	active	1	f	f	0	f
bb4f2a1c-30e4-409a-8946-aa3f95993781	56296710-146a-49de-a14c-33b4e6470df4	ip_eoe0m7	fe42c3aa-46ff-4dfa-9d0a-d7f959d0fcd0	t	20	0.003620	2026-08-25 05:39:23.121	2026-08-25 05:36:02.904	f	\N	active	10	f	f	0	f
b9e603b7-435e-469d-b73d-aed6ecca3bc4	3b774108-c908-447b-ae59-b109bf7bcdef	ip_al73g3	\N	f	2	0.000526	2026-08-25 19:12:41.654	2026-08-25 19:12:39.42	f	\N	active	1	f	f	0	f
ec0e1fa6-51cf-4928-ab95-870728dc7f59	abc7262d-fc41-4bad-a096-4361398154c5	ip_ebghpd	\N	f	8	0.000216	2026-08-23 18:59:38.845	2026-08-23 18:58:41.9	t	Admin	active	2	f	f	1	f
b302c536-04d9-439d-a73d-15d9c86743d4	1328574b-01e7-44a5-88bc-606097bf6e97	ip_eoe0m7	\N	f	6	0.000216	2026-08-23 05:09:56.886	2026-08-23 05:08:47.501	t	Operador	active	3	f	f	2	f
\.


--
-- Data for Name: chat_leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_leads (id, name, phone, email, "serviceInterest", message, source, "ipHash", "createdAt", "readAt") FROM stdin;
d03ff0c8-952f-4cdc-93be-b959f6c6bd2f	Carlos Pérez	+584145677788	\N	Otro	Quiere agendar una cita para un servicio de refrigeración/aire acondicionado.	chat	ip_eoe0m7	2026-08-24 23:18:27.875	2026-08-24 23:52:49.302
c8379ee6-248d-4093-b03e-11eab847252c	Carlos Mendoza	+584123456789	\N	Mantenimiento Preventivo	Mantenimiento preventivo de aire split	chat	ip_18fl	2026-08-21 17:58:19.702	2026-08-24 23:52:54.785
aefc0da1-0152-4046-8a18-1604d11b92cc	Carlos	+584161234567	\N	Mantenimiento Preventivo	Mantenimiento preventivo de aire acondicionado split a domicilio en San Juan de los Morros.	chat	ip_18fl	2026-08-21 19:20:01.067	2026-08-24 23:52:56.432
6fae0740-53d2-40eb-81c9-6d55d59edaf5	Lolo	+584129787766	\N	Diagnóstico	Revisión de nevera y aire acondicionado de ventana a domicilio	chat	ip_eoe0m7	2026-08-22 18:13:37.571	2026-08-24 23:52:57.582
11d18bd6-f46b-4a82-bbed-9be8ca802669	Gorgue Mafangulo	+584129787255	\N	Recarga de Gas	Recarga de gas para nevera	chat	ip_eoe0m7	2026-08-24 23:55:20.073	2026-08-24 23:57:04.505
fe42c3aa-46ff-4dfa-9d0a-d7f959d0fcd0	Tony Gonzales	+584129787766	\N	Recarga de Gas	Recarga de gas para nevera en su hogar.	chat	ip_eoe0m7	2026-08-25 05:39:21.006	2026-08-25 20:57:05.22
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, "conversationId", role, content, "tokensIn", "tokensOut", "createdAt", type, "imageUrl") FROM stdin;
99b92aa5-f69c-4ec6-97d8-c148de79ea4e	ab04903b-9e37-4532-88ce-35ae3346b46e	assistant	Ese número no parece válido, Gorgue. ¿Me puedes dar tu número de WhatsApp real para que el taller pueda contactarte y coordinar la recarga de tu nevera?	1780	39	2026-08-24 23:54:43.061	text	\N
bbf9caef-2874-4bec-b8af-bdaea94e99f0	ab04903b-9e37-4532-88ce-35ae3346b46e	user	+58123	\N	\N	2026-08-24 23:55:00.438	text	\N
e6ae6aea-7573-4dac-8ad6-e1bb9c4fb4bb	ab04903b-9e37-4532-88ce-35ae3346b46e	assistant	Ese número no parece completo. ¿Me puedes dar tu número de WhatsApp completo (con código de área) para que el taller pueda contactarte y coordinar la recarga de tu nevera?	1826	40	2026-08-24 23:55:01.666	text	\N
82a27559-e352-4f24-b865-85af55211dc8	ab04903b-9e37-4532-88ce-35ae3346b46e	user	+584129787255	\N	\N	2026-08-24 23:55:18.553	text	\N
edf79568-80ec-47a0-9057-6725f509acb7	da650529-8067-44af-b7e6-a0f3a4e3bf11	user	Que modelo es ese aire no lo conozco bien	\N	\N	2026-08-23 20:04:49.857	text	\N
fcdcf268-fe7d-4263-bb3a-60df6f805ad2	da650529-8067-44af-b7e6-a0f3a4e3bf11	assistant	Por la imagen no puedo identificar el modelo exacto, pero puedo decirte que es un **aire acondicionado de ventana**, de los más comunes y económicos.\n\nSi quieres, el técnico puede revisarlo en tu domicilio y decirte exactamente qué modelo es y qué necesita. ¿Me dejas tu nombre y WhatsApp para coordinar? 😊	1717	78	2026-08-23 20:04:51.093	text	\N
9bee2ee4-a27f-452e-a89f-ffb2e0e03815	da650529-8067-44af-b7e6-a0f3a4e3bf11	user	Dime	\N	\N	2026-08-23 20:08:14.049	text	\N
91e316f2-ab6b-483c-a32d-0fa2c3e6da5c	ab04903b-9e37-4532-88ce-35ae3346b46e	tool	guardar_contacto: {"ok":true,"leadId":"11d18bd6-f46b-4a82-bbed-9be8ca802669","message":"Contacto guardado. El taller será notificado."}	\N	\N	2026-08-24 23:55:20.09	text	\N
fc7525d3-5905-4250-aaa1-00f7e4712499	ab04903b-9e37-4532-88ce-35ae3346b46e	assistant	¡Listo, Gorgue! Ya quedó registrado tu pedido de recarga de gas para tu nevera. El taller te contactará por WhatsApp para coordinar fecha y hora de la visita. ¡Gracias por confiar en Fresh Service Digital!	3952	201	2026-08-24 23:55:21.179	text	\N
28dd1ba9-d9b8-4185-af8d-a7e4eb01b033	1f1ae9ea-22c2-4e69-897c-21f2f0c51bf7	assistant	Jaja, entiendo que esté dando problemas. 😅 Pero nosotros no nos encargamos de retirar equipos.\n\nSi quieres, podemos revisarlo y decirte si tiene arreglo o si te conviene reemplazarlo. ¿Qué falla presenta?	1824	58	2026-08-25 17:52:28.863	text	\N
bfabb73a-b2bb-4443-a5cb-90e7aa0180a4	c353e23b-67d6-4288-854a-b02ca6e8ba46	user	Hola copito, quiero agendar un servicio s	\N	\N	2026-08-25 19:50:44.238	text	\N
1a130a7c-3ee9-44ed-8bf1-8d8a9e042ac1	c353e23b-67d6-4288-854a-b02ca6e8ba46	assistant	¡Hola! Claro, con gusto te ayudo. ¿Qué tipo de servicio necesitas? ¿Mantenimiento, reparación, instalación o recarga de gas?	1554	37	2026-08-25 19:50:45.143	text	\N
eb22f5aa-712e-456a-9999-fc7d48dc6710	c353e23b-67d6-4288-854a-b02ca6e8ba46	user	Reparación	\N	\N	2026-08-25 19:50:53.028	text	\N
49118331-6bfb-416b-8a5e-581b4f09587d	c353e23b-67d6-4288-854a-b02ca6e8ba46	assistant	Perfecto. ¿Qué equipo necesitas reparar, un aire acondicionado o una nevera?	1598	22	2026-08-25 19:50:53.853	text	\N
4a8d8ae5-5b6c-4a12-8b92-cc0ce51e94e1	c353e23b-67d6-4288-854a-b02ca6e8ba46	user	Aire acondicionado	\N	\N	2026-08-25 19:51:01.75	text	\N
276b0dee-8da8-437b-9799-af9a1aa21f09	c353e23b-67d6-4288-854a-b02ca6e8ba46	assistant	¿Es un aire de ventana o split? Y dime, ¿qué falla presenta el equipo?	1630	21	2026-08-25 19:51:03.031	text	\N
7f142a8c-5108-48cc-a8aa-f5570ef46a1c	c353e23b-67d6-4288-854a-b02ca6e8ba46	user	Split, no enfría bien	\N	\N	2026-08-25 19:51:18.013	text	\N
d390f07b-49e4-4230-9126-03b18b87bfce	c353e23b-67d6-4288-854a-b02ca6e8ba46	tool	consultar_servicios: {"ok":true,"services":[{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire Split","precio_usd":35,"precio":"$35","descripcion":"Limpieza, revisión preventiva del equipo aplica solo 12BTUs"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire Split","precio_usd":60,"precio":"$60","descripcion":"Instalación compresor nuevo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire Split","precio_usd":70,"precio":"$70","descripcion":"Instalación solo del equipo no incluye trabajos electricos"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire Split","precio_usd":50,"precio":"$50","descripcion":"Recarga de gas hasta 1 kilo"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire Split","precio_usd":15,"precio":"$15","descripcion":"Evaluación técnica a domicilio"}]}	\N	\N	2026-08-25 19:51:19.16	text	\N
733bf65a-32d3-41c5-8cbc-d1a50d80b7cc	c353e23b-67d6-4288-854a-b02ca6e8ba46	assistant	Para un split que no enfría bien, te recomiendo empezar con un **diagnóstico a domicilio ($15)** para identificar la falla exacta. También puede ser que necesite **recarga de gas ($50)** o un **mantenimiento preventivo ($35)**.\n\n¿Quieres agendar el diagnóstico? Si es así, me dejas tu nombre y número de WhatsApp para que el taller te contacte.	3672	165	2026-08-25 19:51:20.559	text	\N
f88616f6-9e7a-4212-855a-6d2b930920de	c353e23b-67d6-4288-854a-b02ca6e8ba46	user	Emanuel Cabeza, +56963036647	\N	\N	2026-08-25 19:51:40.447	text	\N
3dcdbe5c-8ff8-48b5-9b71-99572e04ad06	c353e23b-67d6-4288-854a-b02ca6e8ba46	tool	guardar_contacto: {"ok":false,"error":"El número de teléfono no parece venezolano. Debe empezar con +58 o 04XX seguido de 7 dígitos. Pídele al visitante un número válido."}	\N	\N	2026-08-25 19:51:41.933	text	\N
0db9da94-90d2-40c1-8dc6-8307668d38ed	c353e23b-67d6-4288-854a-b02ca6e8ba46	assistant	Gracias, Emanuel. Pero ese número parece ser de Chile (+56). ¿Tienes un número de WhatsApp venezolano (+58) para que el taller pueda contactarte?	3725	168	2026-08-25 19:51:42.852	text	\N
eb1c968c-54e6-48b4-915f-bc22fe01e0cb	c353e23b-67d6-4288-854a-b02ca6e8ba46	user	No tengo, pero ese numero tiene WhatsApp	\N	\N	2026-08-25 19:52:04.603	text	\N
cf2f3c94-2311-4e3d-a99c-7c91fb232d6d	c353e23b-67d6-4288-854a-b02ca6e8ba46	assistant	Entiendo, Emanuel. Pero el taller solo coordina servicios en Venezuela, así que necesitaría un número venezolano (+58) para contactarte y coordinar la visita a tu domicilio en San Juan de los Morros.\n\n¿Tienes algún otro número de contacto en Venezuela?	1818	62	2026-08-25 19:52:05.941	text	\N
ff5aaffe-c0f6-4933-9d74-091f5c774142	c353e23b-67d6-4288-854a-b02ca6e8ba46	operator	epa hermano	\N	\N	2026-08-25 19:52:58.427	text	\N
b242afce-38af-4b99-931f-aca03d88e6c2	9096ca41-b0fe-4695-a8c1-8de50bdeaa4f	user	Hola	\N	\N	2026-08-23 18:53:57.951	text	\N
e68e09d8-d8a9-4dcf-9a7c-abe8d32cf10e	9096ca41-b0fe-4695-a8c1-8de50bdeaa4f	assistant	¡Hola! ¿En qué puedo ayudarte con tu aire acondicionado o nevera?	1476	22	2026-08-23 18:53:59.037	text	\N
b8167a7b-4d06-4f7c-801e-e3f1bc405eb6	9096ca41-b0fe-4695-a8c1-8de50bdeaa4f	user	Aire podrido	\N	\N	2026-08-23 18:54:10.029	text	\N
54f725fa-8d7f-4481-8d89-1d87e5735d60	9096ca41-b0fe-4695-a8c1-8de50bdeaa4f	operator	epa bro es pedro ya estoy yo hablando por aqui	\N	\N	2026-08-23 18:54:26.186	text	\N
a318ec08-fcb8-45e4-ac37-c709c0cdac52	9096ca41-b0fe-4695-a8c1-8de50bdeaa4f	operator	pasame una foto	\N	\N	2026-08-23 18:54:47.373	text	\N
b15f6e64-38fa-4f0a-ba3e-a2780bf80a4b	da650529-8067-44af-b7e6-a0f3a4e3bf11	user	Hey	\N	\N	2026-08-23 20:10:20.132	text	\N
de5cb31e-c509-4764-b60a-ba13500ff5ec	da650529-8067-44af-b7e6-a0f3a4e3bf11	operator	que quieres	\N	\N	2026-08-23 20:11:12.069	text	\N
a0127166-5330-4bd5-90bd-53c9e471469f	ab04903b-9e37-4532-88ce-35ae3346b46e	operator	quires ser registrado	\N	\N	2026-08-25 00:07:13.579	text	\N
15756d37-d850-49be-80da-85fac74a5a0f	ab04903b-9e37-4532-88ce-35ae3346b46e	operator	Le he enviado un formulario rapido para agendar su cita. Por favor, llene los datos y presione Enviar.	\N	\N	2026-08-25 00:07:36.774	text	\N
cc208dce-53b4-4d7a-83fa-e1fb001f42c8	ab04903b-9e37-4532-88ce-35ae3346b46e	operator	✅ Su cita ha sido registrada exitosamente.\n\nNombre: Gorgue Mafangulo\nTelefono: 04129787255\nDireccion: Morera\n\nLe contactaremos por WhatsApp para confirmar fecha y hora. Gracias por confiar en Fresh Service Digital.	\N	\N	2026-08-25 00:10:08.312	text	\N
e87597d9-ed76-4921-a867-b2958d3369ed	ab04903b-9e37-4532-88ce-35ae3346b46e	system	📅 Cita agendada desde el chat: Gorgue Mafangulo — 04129787255 — Morera	\N	\N	2026-08-25 00:10:08.318	text	\N
e6c41fbd-8156-4458-ab44-e57119c33d59	55ec3653-3af5-4655-9f20-d80ec0c78445	user	Reparan lavadoras	\N	\N	2026-08-25 17:53:02.709	text	\N
83a7dc48-fe94-4aea-9d2c-1ed428daee9c	55ec3653-3af5-4655-9f20-d80ec0c78445	assistant	Solo atiendo consultas de refrigeración y aires acondicionados. ¿Necesitas algún servicio de ese tipo?	1546	27	2026-08-25 17:53:04.093	text	\N
91584d03-fbd8-4a2a-9d5c-8dc90283f7b4	ec0e1fa6-51cf-4928-ab95-870728dc7f59	user	Hola	\N	\N	2026-08-23 18:58:41.922	text	\N
0595471a-fde4-4498-be45-87533c3046a6	ec0e1fa6-51cf-4928-ab95-870728dc7f59	assistant	¡Hola! Bienvenido a Fresh Service Digital. 😊 ¿En qué puedo ayudarte con tu aire acondicionado o nevera?	1476	32	2026-08-23 18:58:42.933	text	\N
0d72a8c0-7e8c-451f-96aa-637360ea0b49	ec0e1fa6-51cf-4928-ab95-870728dc7f59	operator	ya soy yo hablando	\N	\N	2026-08-23 18:58:57.951	text	\N
ebd1c85e-d0e0-498b-9dc4-ec4948a955c5	ec0e1fa6-51cf-4928-ab95-870728dc7f59	operator	pasame cualquier imagen sencilla	\N	\N	2026-08-23 18:59:06.298	text	\N
cded5ae8-732e-4112-b4cd-4a55f3198b34	ec0e1fa6-51cf-4928-ab95-870728dc7f59	user	[Imagen]	\N	\N	2026-08-23 18:59:08.05	image	https://api.pedroservicios.xyz/uploads/chat-images/ec0e1fa6-51cf-4928-ab95-870728dc7f59-1787511548034.jpg
0b13bb10-197f-4402-883c-3d262b6f81c8	ec0e1fa6-51cf-4928-ab95-870728dc7f59	operator	bello ya llego	\N	\N	2026-08-23 18:59:16.405	text	\N
6a342f4c-d17a-4f2c-9ea2-276cd59d10e4	ec0e1fa6-51cf-4928-ab95-870728dc7f59	user	🔥🔥	\N	\N	2026-08-23 18:59:23.945	text	\N
8709886a-78c6-4a2a-9830-8b0cb6578da2	ec0e1fa6-51cf-4928-ab95-870728dc7f59	operator	si puedes pasa otra	\N	\N	2026-08-23 18:59:38.842	text	\N
fc316e12-d09e-4bfa-8bd2-c701e7f93172	da650529-8067-44af-b7e6-a0f3a4e3bf11	operator	dime que pasa	\N	\N	2026-08-23 20:21:02.12	text	\N
d75e0921-20c9-4193-805e-c7afc51e3f3b	99411e58-72e9-43ca-9dc6-0003ed80110b	user	Buenas noches quiero una cita a domicilio	\N	\N	2026-08-25 05:00:31.632	text	\N
7b4b741a-3e22-43fe-8786-507f24ed4a08	99411e58-72e9-43ca-9dc6-0003ed80110b	assistant	¡Buenas noches! Claro, con gusto te ayudo. ¿Qué servicio necesitas? ¿Mantenimiento, reparación, instalación o recarga de gas?	1555	38	2026-08-25 05:00:32.549	text	\N
dc18f77b-9b6e-4ab9-9f42-a28aa7fc7fa1	99411e58-72e9-43ca-9dc6-0003ed80110b	operator	Un momento por favor, estoy revisando su caso.	\N	\N	2026-08-25 05:00:53.911	text	\N
f8365059-36f1-44c7-9252-919ff6b83ff7	99411e58-72e9-43ca-9dc6-0003ed80110b	user	[Imagen]	\N	\N	2026-08-25 05:01:02.756	image	https://api.pedroservicios.xyz/uploads/chat-images/99411e58-72e9-43ca-9dc6-0003ed80110b-1787634062753.jpg
1f772948-0ae9-40b5-813d-ece69f5118cb	99411e58-72e9-43ca-9dc6-0003ed80110b	user	Este mi aire	\N	\N	2026-08-25 05:01:09.43	text	\N
14c47706-95f5-435b-b8df-5d5b5e02139c	99411e58-72e9-43ca-9dc6-0003ed80110b	operator	ok le doy para agendar una cita	\N	\N	2026-08-25 05:01:21.822	text	\N
7d225bcf-e198-4f97-9f3d-11577c0954a2	99411e58-72e9-43ca-9dc6-0003ed80110b	operator	Le he enviado un formulario rapido para agendar su cita. Por favor, llene los datos y presione Enviar.	\N	\N	2026-08-25 05:01:54.431	text	\N
a9951634-a66b-406b-8631-d142d25ed6fe	dfd1bb2b-941d-4b23-8b20-50a07d861063	user	Precios de los servicios	\N	\N	2026-08-25 18:03:26.193	text	\N
6b7c0db8-0c7a-45d8-ba20-be5be04fbf34	dfd1bb2b-941d-4b23-8b20-50a07d861063	tool	consultar_servicios: {"ok":true,"services":[{"servicio":"Nevera","categoria":"Recarga","equipo":"Nevera","precio_usd":50,"precio":"$50","descripcion":"1 kilo de gas"},{"servicio":"Reparacion de fugas de gas sencilla","categoria":"Reparación","equipo":"Nevera","precio_usd":30,"precio":"$30","descripcion":"No incluye la recarga del gas"},{"servicio":"Reemplazo de compresor","categoria":"Reparación","equipo":"Nevera","precio_usd":60,"precio":"$60","descripcion":"Instalacion de compresor ya funcionado la nevera no incluye los materiales"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire Split","precio_usd":35,"precio":"$35","descripcion":"Limpieza, revisión preventiva del equipo aplica solo 12BTUs"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire Split","precio_usd":60,"precio":"$60","descripcion":"Instalación compresor nuevo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire Split","precio_usd":70,"precio":"$70","descripcion":"Instalación solo del equipo no incluye trabajos electricos"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire Split","precio_usd":50,"precio":"$50","descripcion":"Recarga de gas hasta 1 kilo"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire Split","precio_usd":15,"precio":"$15","descripcion":"Evaluación técnica a domicilio"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Limpieza y revisión preventiva del equipo"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Diagnóstico y reparación del equipo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Instalación profesional del equipo"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Recarga de gas refrigerante"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Evaluación técnica del equipo"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire de Ventana","precio_usd":25,"precio":"$25","descripcion":"Limpieza, cambio de componentes básicos"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire de Ventana","precio_usd":60,"precio":"$60","descripcion":"Instalación compresor nuevo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire de Ventana","precio_usd":40,"precio":"$40","descripcion":"Instalación profesional del equipo"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire de Ventana","precio_usd":50,"precio":"$50","descripcion":"Recarga de gas hasta 1 kilo"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire de Ventana","precio_usd":15,"precio":"$15","descripcion":"Evaluación técnica a domicilio"}]}	\N	\N	2026-08-25 18:03:26.99	text	\N
3311c983-c5d4-4117-87e2-b77827426251	dfd1bb2b-941d-4b23-8b20-50a07d861063	assistant	Aquí tienes nuestros precios (en dólares, al cambio del día):\n\n**Aires de Ventana**\n- Diagnóstico: $15\n- Mantenimiento preventivo: $25\n- Instalación: $40\n- Recarga de gas: $50\n- Reparación (compresor nuevo): $60\n\n**Aires Split**\n- Diagnóstico: $15\n- Mantenimiento preventivo (12 BTUs): $35\n- Recarga de gas: $50\n- Reparación (compresor nuevo): $60\n- Instalación: $70\n\n**Neveras**\n- Reparación de fugas sencilla: $30\n- Recarga de gas (1 kilo): $50\n- Reemplazo de compresor: $60\n\n**Aires de 3 a 5 Toneladas**: cotización personalizada (no tienen precio público).\n\n¿Qué servicio necesitas? Así te ayudo a coordinar la visita.	4080	252	2026-08-25 18:03:29.207	text	\N
363aed35-dff6-4ac0-b1b5-e3b6f8959ad9	00c261b2-5f32-4c27-ae35-cbdb3a34a863	user	Hola	\N	\N	2026-08-23 19:03:07.306	text	\N
c59f934a-0444-43c1-8c60-3c835ad4854e	00c261b2-5f32-4c27-ae35-cbdb3a34a863	assistant	¡Hola! ¿Cómo puedo ayudarte con tu aire acondicionado o nevera? 😊	1476	23	2026-08-23 19:03:08.651	text	\N
72cd0e0a-9914-4d8c-9e9c-5f654563bee1	9096ca41-b0fe-4695-a8c1-8de50bdeaa4f	user	[Imagen]	\N	\N	2026-08-23 19:03:17.344	image	https://api.pedroservicios.xyz/uploads/chat-images/9096ca41-b0fe-4695-a8c1-8de50bdeaa4f-1787511797342.jpg
290362ce-0ab4-4ac8-a06d-e4fcf6a57e81	00c261b2-5f32-4c27-ae35-cbdb3a34a863	user	[Imagen]	\N	\N	2026-08-23 19:03:20.543	image	https://api.pedroservicios.xyz/uploads/chat-images/00c261b2-5f32-4c27-ae35-cbdb3a34a863-1787511800542.jpg
21e7740d-685e-414c-95b0-05f41ca43004	9096ca41-b0fe-4695-a8c1-8de50bdeaa4f	user	Ahi te paso esta	\N	\N	2026-08-23 19:03:25.87	text	\N
30cfa6f9-be62-4045-9bf2-3e167796b6af	99411e58-72e9-43ca-9dc6-0003ed80110b	operator	✅ Su cita ha sido registrada exitosamente.\n\nNombre: Pablo test\nTelefono: 04129877766\nDireccion: La morera\n\nLe contactaremos por WhatsApp para confirmar fecha y hora. Gracias por confiar en Fresh Service Digital.	\N	\N	2026-08-25 05:02:51.825	text	\N
f6142eb0-fd65-44d3-a002-59f4d8d54d5a	99411e58-72e9-43ca-9dc6-0003ed80110b	system	📅 Cita agendada desde el chat: Pablo test — 04129877766 — La morera	\N	\N	2026-08-25 05:02:51.829	text	\N
10d8aa60-46a5-42d0-abbf-384aa6fd83a2	97be8f84-fec6-46ed-ab9c-dc86b5447067	user	Saludos que precios de los servicios	\N	\N	2026-08-25 18:12:33.841	text	\N
cf1f9a2c-afa2-4b58-ac78-f61c5d6176a8	97be8f84-fec6-46ed-ab9c-dc86b5447067	tool	consultar_servicios: {"ok":true,"services":[{"servicio":"Nevera","categoria":"Recarga","equipo":"Nevera","precio_usd":50,"precio":"$50","descripcion":"1 kilo de gas"},{"servicio":"Reparacion de fugas de gas sencilla","categoria":"Reparación","equipo":"Nevera","precio_usd":30,"precio":"$30","descripcion":"No incluye la recarga del gas"},{"servicio":"Reemplazo de compresor","categoria":"Reparación","equipo":"Nevera","precio_usd":60,"precio":"$60","descripcion":"Instalacion de compresor ya funcionado la nevera no incluye los materiales"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire Split","precio_usd":35,"precio":"$35","descripcion":"Limpieza, revisión preventiva del equipo aplica solo 12BTUs"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire Split","precio_usd":60,"precio":"$60","descripcion":"Instalación compresor nuevo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire Split","precio_usd":70,"precio":"$70","descripcion":"Instalación solo del equipo no incluye trabajos electricos"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire Split","precio_usd":50,"precio":"$50","descripcion":"Recarga de gas hasta 1 kilo"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire Split","precio_usd":15,"precio":"$15","descripcion":"Evaluación técnica a domicilio"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Limpieza y revisión preventiva del equipo"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Diagnóstico y reparación del equipo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Instalación profesional del equipo"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Recarga de gas refrigerante"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Evaluación técnica del equipo"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire de Ventana","precio_usd":25,"precio":"$25","descripcion":"Limpieza, cambio de componentes básicos"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire de Ventana","precio_usd":60,"precio":"$60","descripcion":"Instalación compresor nuevo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire de Ventana","precio_usd":40,"precio":"$40","descripcion":"Instalación profesional del equipo"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire de Ventana","precio_usd":50,"precio":"$50","descripcion":"Recarga de gas hasta 1 kilo"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire de Ventana","precio_usd":15,"precio":"$15","descripcion":"Evaluación técnica a domicilio"}]}	\N	\N	2026-08-25 18:12:35.003	text	\N
4dd2b194-a950-4b15-8733-f6a26d8392be	97be8f84-fec6-46ed-ab9c-dc86b5447067	assistant	¡Claro! Aquí te dejo nuestros precios en dólares (se pagan al cambio del día según BCV):\n\n**Aires de Ventana:**\n- Mantenimiento: $25\n- Reparación (compresor nuevo): $60\n- Instalación: $40\n- Recarga de gas: $50\n- Diagnóstico: $15\n\n**Aires Split:**\n- Mantenimiento (12 BTUs): $35\n- Reparación (compresor nuevo): $60\n- Instalación: $70\n- Recarga de gas: $50\n- Diagnóstico: $15\n\n**Neveras:**\n- Recarga de gas (1 kilo): $50\n- Reparación de fugas: $30\n- Reemplazo de compresor: $60\n\n**Aires por Toneladas (3-5 TON):** requieren cotización personalizada.\n\n¿Qué tipo de equipo necesitas atender? Así te ayudo mejor. 😊	4091	266	2026-08-25 18:12:36.956	text	\N
c216d8e4-d168-47b4-a09e-790b4b43bbd4	00c261b2-5f32-4c27-ae35-cbdb3a34a863	user	Se dañó mi refrigeradora ya no funciona	\N	\N	2026-08-23 19:03:39.96	text	\N
f3b3d923-7081-4e58-870a-bcf9c3689022	00c261b2-5f32-4c27-ae35-cbdb3a34a863	assistant	¡Entendido! Lamento que tu nevera se haya dañado. Para ayudarte, ¿me puedes indicar qué tipo de falla presenta? ¿No enfría, no prende, hace ruido?\n\nTambién, ¿me dejas tu nombre y un WhatsApp para que el taller te contacte y coordine la visita?	1517	72	2026-08-23 19:03:41.919	text	\N
35d8b342-e80c-42df-92e4-bc7c15f1e240	00c261b2-5f32-4c27-ae35-cbdb3a34a863	operator	hola gracias por tu foto	\N	\N	2026-08-23 19:04:14.828	text	\N
a7c68826-5c88-4d9a-9d38-1959c3873a5f	00c261b2-5f32-4c27-ae35-cbdb3a34a863	user	Hacer ruido y no prende . Soy Adrianela cabeza y mi número es +593 983367865	\N	\N	2026-08-23 19:04:17.599	text	\N
40d2564d-d99c-4873-927d-7b4b997cc9bb	00c261b2-5f32-4c27-ae35-cbdb3a34a863	operator	excelente	\N	\N	2026-08-23 19:05:00.198	text	\N
b7b66196-afaa-410d-8827-5a952df91254	bb4f2a1c-30e4-409a-8946-aa3f95993781	user	Hola	\N	\N	2026-08-25 05:36:02.934	text	\N
d271171c-314f-42e2-ade0-3b8eea547eee	bb4f2a1c-30e4-409a-8946-aa3f95993781	assistant	¡Hola! ¿Cómo puedo ayudarte hoy? ¿Necesitas algún servicio de refrigeración o aires acondicionados?	1544	29	2026-08-25 05:36:04.298	text	\N
d99b9b39-efde-4673-9833-efce5501469c	bb4f2a1c-30e4-409a-8946-aa3f95993781	user	Quiero saber si haces reparaciones de neveras	\N	\N	2026-08-25 05:36:23.609	text	\N
dd30684e-21f1-4dc8-b84a-493a4c0e1a1d	bb4f2a1c-30e4-409a-8946-aa3f95993781	tool	consultar_servicios: {"ok":true,"services":[{"servicio":"Nevera","categoria":"Recarga","equipo":"Nevera","precio_usd":50,"precio":"$50","descripcion":"1 kilo de gas"},{"servicio":"Reemplazo de compresor","categoria":"Reparación","equipo":"Nevera","precio_usd":60,"precio":"$60","descripcion":"Instalacion de compresor ya funcionado la nevera no incluye los materiales"},{"servicio":"Reparacion de fugas de gas sencilla","categoria":"Reparación","equipo":"Nevera","precio_usd":30,"precio":"$30","descripcion":"No incluye la recarga del gas"}]}	\N	\N	2026-08-25 05:36:25.628	text	\N
71559cf8-2a5b-4022-9c8d-1783b98a749c	bb4f2a1c-30e4-409a-8946-aa3f95993781	assistant	¡Sí! Reparamos neveras. Te comento algunos servicios y precios:\n\n- **Recarga de gas** (1 kilo): **$50**\n- **Reemplazo de compresor**: **$60** (no incluye materiales)\n- **Reparación de fugas de gas sencilla**: **$30** (no incluye la recarga)\n\n¿Qué problema tiene tu nevera? Así te indico mejor qué necesitas y te ayudo a coordinar.	3433	184	2026-08-25 05:36:27.847	text	\N
1e6fa4f6-7218-4944-b4b1-22e805aa5c64	bb4f2a1c-30e4-409a-8946-aa3f95993781	user	Me puedes agendar una cita para mi hogar	\N	\N	2026-08-25 05:36:54.66	text	\N
1951f105-fd9b-444d-9fcc-c83fbfcb4ed2	bb4f2a1c-30e4-409a-8946-aa3f95993781	assistant	¡Claro! Para agendar la cita necesito algunos datos:\n\n1. ¿Qué tipo de servicio necesitas para tu nevera? (¿reparación, recarga de gas, mantenimiento?)\n2. ¿Me das tu **nombre** y **número de WhatsApp**?\n\nCon eso el taller te contacta para coordinar fecha y hora.	1706	73	2026-08-25 05:36:56.8	text	\N
4a9c5f81-f56f-477f-98e5-cd7a6ab6f6cf	bb4f2a1c-30e4-409a-8946-aa3f95993781	user	Necesito una recarga de gas	\N	\N	2026-08-25 05:37:17.374	text	\N
1e918d0a-4c18-4761-ab26-f887712935db	bb4f2a1c-30e4-409a-8946-aa3f95993781	assistant	Perfecto, la recarga de gas para nevera cuesta **$50** (por kilo). \n\nPara agendar, ¿me das tu **nombre** y **número de WhatsApp**? Así el taller te contacta para coordinar la visita a tu hogar.	1791	56	2026-08-25 05:37:19.863	text	\N
a328b9fd-b43c-4475-9e31-da312dfc5b33	bb4f2a1c-30e4-409a-8946-aa3f95993781	user	Trol González	\N	\N	2026-08-25 05:37:39.796	text	\N
927ff062-1e75-43fa-bae0-4e9f30ec792e	bb4f2a1c-30e4-409a-8946-aa3f95993781	assistant	Eso no es un nombre apropiado. ¿Necesitas algún servicio de refrigeración?	1854	20	2026-08-25 05:37:41.718	text	\N
ba8c0a51-7c2c-4c6d-ae2c-5e16523262e8	7f33aa6f-35f3-4029-88db-04f7549ce3d0	user	Copito puedo solicitar tu servicio en san Fernando de Apure?	\N	\N	2026-08-25 18:28:14.282	text	\N
0e586a20-5c90-40e6-8188-1d39550527e2	7f33aa6f-35f3-4029-88db-04f7549ce3d0	assistant	Hola! Gracias por escribirnos. Lamentablemente solo cubrimos San Juan de los Morros y sus alrededores en el estado Guárico, así que no llegamos hasta San Fernando de Apure.\n\n¿Tienes algún equipo en San Juan de los Morros que necesites revisar?	1557	66	2026-08-25 18:28:15.781	text	\N
0870c7dc-d9d1-4faf-9ed6-4c154929ff30	587d09f2-f843-46d3-9f90-275559c010de	user	Hola	\N	\N	2026-08-23 19:45:40.021	text	\N
41f31ae1-1e9a-44e3-9b5b-72a2635461ea	587d09f2-f843-46d3-9f90-275559c010de	assistant	¡Hola! Bienvenido a Fresh Service Digital. ¿En qué puedo ayudarte con tu aire acondicionado o nevera?	1476	30	2026-08-23 19:45:41.14	text	\N
0270054f-37f7-4c87-9b32-4f507b1b4c82	587d09f2-f843-46d3-9f90-275559c010de	operator	hola soy tu asesor que te ayudo😉🌡️❄️	\N	\N	2026-08-23 19:46:17.119	text	\N
30195b46-7659-4844-a1ca-f4c40082a839	587d09f2-f843-46d3-9f90-275559c010de	user	Quiero envíar una foto de mi aire	\N	\N	2026-08-23 19:46:39.374	text	\N
0848f210-ff25-40df-93bc-3e26b39d2ecc	587d09f2-f843-46d3-9f90-275559c010de	operator	envialo 📸	\N	\N	2026-08-23 19:46:54.406	text	\N
893493bf-6b99-40c6-a5af-e37273b1fd83	587d09f2-f843-46d3-9f90-275559c010de	user	[Imagen]	\N	\N	2026-08-23 19:47:06.536	image	https://api.pedroservicios.xyz/uploads/chat-images/587d09f2-f843-46d3-9f90-275559c010de-1787514426526.jpg
34e570ca-96d7-4a70-9fca-db928cc02470	712b08cd-c6e0-42e2-8ca3-17b6e6440a3f	user	Quiero una cita	\N	\N	2026-08-24 18:44:18.973	text	\N
1e5c728c-25a9-4943-b935-cb8af0b1f915	712b08cd-c6e0-42e2-8ca3-17b6e6440a3f	assistant	¡Claro, con gusto! Para agendar tu cita necesito tu nombre y un número de WhatsApp. ¿Qué servicio necesitas?	1479	29	2026-08-24 18:44:19.785	text	\N
d90b8aeb-b3d2-4df2-9815-b16af90867c7	712b08cd-c6e0-42e2-8ca3-17b6e6440a3f	operator	ya le envio para que llene su formulario	\N	\N	2026-08-24 18:44:53.537	text	\N
d49b4a6c-65ae-4e8f-afac-e541d78158bf	712b08cd-c6e0-42e2-8ca3-17b6e6440a3f	operator	Le he enviado un formulario rapido para agendar su cita. Por favor, llene los datos y presione Enviar.	\N	\N	2026-08-24 18:45:05.669	text	\N
4ca39a4f-1d99-42f6-9568-5c0249b3fc12	712b08cd-c6e0-42e2-8ca3-17b6e6440a3f	operator	✅ Su cita ha sido registrada exitosamente.\n\nNombre: Kevin Gail\nTelefono: 04129986677\nDireccion: Banco obrero\n\nLe contactaremos por WhatsApp para confirmar fecha y hora. Gracias por confiar en Fresh Service Digital.	\N	\N	2026-08-24 18:47:05.45	text	\N
17d95228-34f8-414a-94d4-5db7d08ffca5	712b08cd-c6e0-42e2-8ca3-17b6e6440a3f	system	📅 Cita agendada desde el chat: Kevin Gail — 04129986677 — Banco obrero	\N	\N	2026-08-24 18:47:05.454	text	\N
36298b7f-8d0e-43ce-b1c2-c1ef7b36920c	712b08cd-c6e0-42e2-8ca3-17b6e6440a3f	operator	Gracias por comunicarse con nosotros. ¡Que tenga buen día!	\N	\N	2026-08-24 18:47:25.372	text	\N
1d83198a-d805-4e00-a701-7457afb12e04	bb4f2a1c-30e4-409a-8946-aa3f95993781	user	Recarga de gas	\N	\N	2026-08-25 05:38:00.929	text	\N
c77365ba-2a7b-48f4-8f5b-5d7e3e24bacd	bb4f2a1c-30e4-409a-8946-aa3f95993781	assistant	Para coordinar la recarga de gas necesito tu **nombre real** y **número de WhatsApp**. ¿Me los puedes facilitar?	1882	28	2026-08-25 05:38:02.935	text	\N
ea911bce-540e-44cc-8660-2a2212312153	bb4f2a1c-30e4-409a-8946-aa3f95993781	user	Tony Gonzales	\N	\N	2026-08-25 05:38:20.547	text	\N
f4d6ef98-f2d8-47f9-b1ab-902a7744ca74	bb4f2a1c-30e4-409a-8946-aa3f95993781	assistant	Gracias, Tony. ¿Me confirmas tu **número de WhatsApp** para que el taller te contacte y coordine la visita?	1917	28	2026-08-25 05:38:22.697	text	\N
12767f2c-ce4c-460a-aa2f-37d2c8ddf9b9	bb4f2a1c-30e4-409a-8946-aa3f95993781	user	00998877	\N	\N	2026-08-25 05:38:33.896	text	\N
9da743e4-e724-4a61-a43b-daefc318820b	bb4f2a1c-30e4-409a-8946-aa3f95993781	assistant	Ese número no parece válido. ¿Me confirmas tu **número de WhatsApp** con su código de país (ej: +58 412-...)? Así el taller puede comunicarse contigo.	1952	42	2026-08-25 05:38:35.768	text	\N
f8152df0-9b85-4cef-8567-2bb3e6cacb90	bb4f2a1c-30e4-409a-8946-aa3f95993781	user	+574129787766	\N	\N	2026-08-25 05:38:58.245	text	\N
dabd6a84-2dc8-4be0-9f83-590cd3b322da	bb4f2a1c-30e4-409a-8946-aa3f95993781	tool	guardar_contacto: {"ok":false,"error":"El número de teléfono no parece venezolano. Debe empezar con +58 o 04XX seguido de 7 dígitos. Pídele al visitante un número válido."}	\N	\N	2026-08-25 05:39:00.828	text	\N
4a6faf2d-671b-47e6-ac0b-9d2c29f08a96	bb4f2a1c-30e4-409a-8946-aa3f95993781	assistant	El número que me diste no parece venezolano. Recuerda que atendemos en San Juan de los Morros, Guárico (Venezuela). ¿Me confirmas tu **número de WhatsApp** con formato venezolano (ej: +58 412-...)?	4115	176	2026-08-25 05:39:02.937	text	\N
5ce7ca27-c832-48de-a0b9-99fafb3f873f	bb4f2a1c-30e4-409a-8946-aa3f95993781	user	4129787766	\N	\N	2026-08-25 05:39:18.513	text	\N
2861a357-26f6-4850-b72d-a04688371b87	bb4f2a1c-30e4-409a-8946-aa3f95993781	tool	guardar_contacto: {"ok":true,"leadId":"fe42c3aa-46ff-4dfa-9d0a-d7f959d0fcd0","message":"Contacto guardado. El taller será notificado."}	\N	\N	2026-08-25 05:39:21.026	text	\N
9d671466-166e-44c6-8975-ae0c0dd45da2	bb4f2a1c-30e4-409a-8946-aa3f95993781	assistant	¡Listo, Tony! Ya quedó registrado tu pedido de recarga de gas. El taller te contactará por WhatsApp para coordinar la fecha y hora de la visita a tu hogar. 👍	4040	185	2026-08-25 05:39:23.117	text	\N
9c94ebde-d76d-42ba-b739-cc1a77805972	b9e603b7-435e-469d-b73d-aed6ecca3bc4	user	Cuánto cuesta la lavada y mantenimiento por el aire de ventana? Vivo en un primer piso.	\N	\N	2026-08-25 19:12:39.446	text	\N
bc78a25f-cf64-4e29-af45-3637bb82d157	b9e603b7-435e-469d-b73d-aed6ecca3bc4	tool	consultar_servicios: {"ok":true,"services":[{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire de Ventana","precio_usd":25,"precio":"$25","descripcion":"Limpieza, cambio de componentes básicos"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire de Ventana","precio_usd":60,"precio":"$60","descripcion":"Instalación compresor nuevo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire de Ventana","precio_usd":40,"precio":"$40","descripcion":"Instalación profesional del equipo"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire de Ventana","precio_usd":50,"precio":"$50","descripcion":"Recarga de gas hasta 1 kilo"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire de Ventana","precio_usd":15,"precio":"$15","descripcion":"Evaluación técnica a domicilio"}]}	\N	\N	2026-08-25 19:12:40.423	text	\N
68d3c062-4fa8-4d3d-b68b-c73470227465	b9e603b7-435e-469d-b73d-aed6ecca3bc4	assistant	El mantenimiento preventivo (lavada y limpieza) para tu aire de ventana cuesta **$25**, e incluye limpieza y revisión de componentes básicos. 😊\n\n¿Te gustaría agendar el servicio? Solo necesito tu nombre y número de WhatsApp para que el taller te contacte y coordine la visita.	3472	143	2026-08-25 19:12:41.65	text	\N
e9fd29dc-db80-43af-b906-6f8270b28ae7	d393d240-bb6d-4d61-9bd7-03cc84cd3935	user	Hola	\N	\N	2026-08-24 23:17:01.805	text	\N
d6286537-50a1-4a6c-95a4-40615555d641	d393d240-bb6d-4d61-9bd7-03cc84cd3935	assistant	¡Hola! Bienvenido a Fresh Service Digital. 😊 ¿En qué puedo ayudarte con tu aire acondicionado o nevera?	1476	32	2026-08-24 23:17:03.739	text	\N
9e6c2f05-97e6-4337-9d67-b5fd5ed5dd15	d393d240-bb6d-4d61-9bd7-03cc84cd3935	user	Quiero agendar una cita	\N	\N	2026-08-24 23:17:17.48	text	\N
dfd0902d-e47c-4bd2-8846-82ec0bbf142e	d393d240-bb6d-4d61-9bd7-03cc84cd3935	assistant	¡Claro! Con gusto te ayudo a agendar. Para eso necesito tu nombre y un número de WhatsApp para que el taller te contacte y coordine la fecha y hora. ¿Me los pasas?	1519	45	2026-08-24 23:17:18.636	text	\N
d14b944c-fc55-4eb7-bb09-9f78d3b85b98	d393d240-bb6d-4d61-9bd7-03cc84cd3935	user	Me puede registrar	\N	\N	2026-08-24 23:17:41.964	text	\N
9138efac-2772-47eb-be60-f5b2cf2b6213	d393d240-bb6d-4d61-9bd7-03cc84cd3935	assistant	¡Perfecto! Para registrarte necesito tu nombre y un número de WhatsApp (o correo). ¿Me los compartes?	1571	28	2026-08-24 23:17:42.818	text	\N
f3bd1947-6264-423c-bda1-61a3311e5b68	587d09f2-f843-46d3-9f90-275559c010de	user	Ayúdeme su no lo denuncia	\N	\N	2026-08-23 19:50:19.529	text	\N
4b1758a4-3446-4e06-80e4-62c0381b8334	587d09f2-f843-46d3-9f90-275559c010de	operator	hey	\N	\N	2026-08-23 19:51:56.252	text	\N
15e36e63-becc-4435-8e68-c3544f00738e	d393d240-bb6d-4d61-9bd7-03cc84cd3935	user	Carlos Pérez	\N	\N	2026-08-24 23:17:59.649	text	\N
76477669-cdf4-4ffa-a4e0-69700416503c	d393d240-bb6d-4d61-9bd7-03cc84cd3935	assistant	¡Gracias, Carlos! Solo me falta tu número de WhatsApp para registrarte. ¿Me lo pasas?	1606	24	2026-08-24 23:18:00.374	text	\N
48a53408-9f85-4c0f-a333-78554f27494e	d393d240-bb6d-4d61-9bd7-03cc84cd3935	user	04145677788	\N	\N	2026-08-24 23:18:26.39	text	\N
fac8dfce-3669-4836-a41d-d1d98bbe5a42	d393d240-bb6d-4d61-9bd7-03cc84cd3935	tool	guardar_contacto: {"ok":true,"leadId":"d03ff0c8-952f-4cdc-93be-b959f6c6bd2f","message":"Contacto guardado. El taller será notificado."}	\N	\N	2026-08-24 23:18:27.926	text	\N
d414abae-1341-446a-b1b7-6c7619b03595	d393d240-bb6d-4d61-9bd7-03cc84cd3935	assistant	¡Listo, Carlos! Ya quedaste registrado. ✅ El taller te contactará por WhatsApp para coordinar la fecha y hora de tu cita. ¿Necesitas algo más?	3461	165	2026-08-24 23:18:29.008	text	\N
9d921dfc-48b9-4d53-8ef1-e0f479cf292d	1f1ae9ea-22c2-4e69-897c-21f2f0c51bf7	user	Quiero saber precios de los servicios	\N	\N	2026-08-25 17:51:13.983	text	\N
edf2445a-d6a3-457d-93cb-ffb1429fcbd8	1f1ae9ea-22c2-4e69-897c-21f2f0c51bf7	tool	consultar_servicios: {"ok":true,"services":[{"servicio":"Nevera","categoria":"Recarga","equipo":"Nevera","precio_usd":50,"precio":"$50","descripcion":"1 kilo de gas"},{"servicio":"Reparacion de fugas de gas sencilla","categoria":"Reparación","equipo":"Nevera","precio_usd":30,"precio":"$30","descripcion":"No incluye la recarga del gas"},{"servicio":"Reemplazo de compresor","categoria":"Reparación","equipo":"Nevera","precio_usd":60,"precio":"$60","descripcion":"Instalacion de compresor ya funcionado la nevera no incluye los materiales"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire Split","precio_usd":35,"precio":"$35","descripcion":"Limpieza, revisión preventiva del equipo aplica solo 12BTUs"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire Split","precio_usd":60,"precio":"$60","descripcion":"Instalación compresor nuevo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire Split","precio_usd":70,"precio":"$70","descripcion":"Instalación solo del equipo no incluye trabajos electricos"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire Split","precio_usd":50,"precio":"$50","descripcion":"Recarga de gas hasta 1 kilo"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire Split","precio_usd":15,"precio":"$15","descripcion":"Evaluación técnica a domicilio"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Limpieza y revisión preventiva del equipo"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Diagnóstico y reparación del equipo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Instalación profesional del equipo"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Recarga de gas refrigerante"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire 3 Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Evaluación técnica del equipo"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire de Ventana","precio_usd":25,"precio":"$25","descripcion":"Limpieza, cambio de componentes básicos"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire de Ventana","precio_usd":60,"precio":"$60","descripcion":"Instalación compresor nuevo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire de Ventana","precio_usd":40,"precio":"$40","descripcion":"Instalación profesional del equipo"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire de Ventana","precio_usd":50,"precio":"$50","descripcion":"Recarga de gas hasta 1 kilo"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire de Ventana","precio_usd":15,"precio":"$15","descripcion":"Evaluación técnica a domicilio"}]}	\N	\N	2026-08-25 17:51:15.235	text	\N
2021c1a2-c93b-41ed-8b76-99b29e7547c7	1f1ae9ea-22c2-4e69-897c-21f2f0c51bf7	assistant	¡Aquí tienes nuestros precios! 💰\n\n**Aires de Ventana:**\n- Mantenimiento: $25\n- Reparación (compresor): $60\n- Instalación: $40\n- Recarga de gas: $50\n- Diagnóstico: $15\n\n**Aires Split (hasta 12 BTUs):**\n- Mantenimiento: $35\n- Reparación (compresor): $60\n- Instalación: $70\n- Recarga de gas: $50\n- Diagnóstico: $15\n\n**Neveras:**\n- Recarga de gas (1 kilo): $50\n- Reparación de fugas: $30\n- Reemplazo de compresor: $60\n\n**Aires por Toneladas (3-5 TON):** cotización personalizada.\n\n¿Qué tipo de equipo necesitas atender? Así te ayudo mejor. 😊	4085	245	2026-08-25 17:51:16.989	text	\N
ba1c212c-7b1c-4e8f-acc0-566bb9d5e852	1f1ae9ea-22c2-4e69-897c-21f2f0c51bf7	user	Trabajas con percos congeladores	\N	\N	2026-08-25 17:52:00.94	text	\N
21226402-7d0e-49ee-8e78-6ef0207cbbb4	1f1ae9ea-22c2-4e69-897c-21f2f0c51bf7	assistant	Sí, trabajamos con neveras y refrigeradores domésticos, incluyendo congeladores. 🧊\n\n¿Qué le pasa al tuyo? ¿Necesitas mantenimiento, reparación o recarga de gas?	1762	49	2026-08-25 17:52:02.223	text	\N
6dd95a5a-c220-4091-a302-cafe9cd3262d	fe733295-8751-4504-8dfa-996b85a53e53	user	Cuál es el costo?	\N	\N	2026-08-25 19:26:19.096	text	\N
07902822-2bf9-4468-b883-c6c50d41ce19	fe733295-8751-4504-8dfa-996b85a53e53	tool	consultar_servicios: {"ok":true,"services":[{"servicio":"Nevera","categoria":"Recarga","equipo":"Nevera","precio_usd":50,"precio":"$50","descripcion":"1 kilo de gas"},{"servicio":"Reemplazo de compresor","categoria":"Reparación","equipo":"Nevera","precio_usd":60,"precio":"$60","descripcion":"Instalacion de compresor ya funcionado la nevera no incluye los materiales"},{"servicio":"Reparacion de fugas de gas sencilla","categoria":"Reparación","equipo":"Nevera","precio_usd":30,"precio":"$30","descripcion":"No incluye la recarga del gas"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire Split","precio_usd":35,"precio":"$35","descripcion":"Limpieza, revisión preventiva del equipo aplica solo 12BTUs"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire Split","precio_usd":60,"precio":"$60","descripcion":"Instalación compresor nuevo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire Split","precio_usd":70,"precio":"$70","descripcion":"Instalación solo del equipo no incluye trabajos electricos"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire Split","precio_usd":50,"precio":"$50","descripcion":"Recarga de gas hasta 1 kilo"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire Split","precio_usd":15,"precio":"$15","descripcion":"Evaluación técnica a domicilio"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire de Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Limpieza y revisión preventiva del equipo"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire de Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Diagnóstico y reparación del equipo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire de Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Instalación profesional del equipo"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire de Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Recarga de gas refrigerante"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire de Toneladas","precio_usd":null,"precio":"cotización personalizada","descripcion":"Evaluación técnica del equipo"},{"servicio":"Mantenimiento Preventivo","categoria":"Mantenimiento","equipo":"Aire de Ventana","precio_usd":25,"precio":"$25","descripcion":"Limpieza, cambio de componentes básicos"},{"servicio":"Reparación","categoria":"Reparación","equipo":"Aire de Ventana","precio_usd":60,"precio":"$60","descripcion":"Instalación compresor nuevo"},{"servicio":"Instalación","categoria":"Instalación","equipo":"Aire de Ventana","precio_usd":40,"precio":"$40","descripcion":"Instalación profesional del equipo"},{"servicio":"Recarga de Gas","categoria":"Recarga","equipo":"Aire de Ventana","precio_usd":50,"precio":"$50","descripcion":"Recarga de gas hasta 1 kilo"},{"servicio":"Diagnóstico","categoria":"Diagnóstico","equipo":"Aire de Ventana","precio_usd":15,"precio":"$15","descripcion":"Evaluación técnica a domicilio"}]}	\N	\N	2026-08-25 19:26:19.951	text	\N
c5f79c7a-6610-479b-aa90-f3a0ad6f589b	fe733295-8751-4504-8dfa-996b85a53e53	assistant	¡Claro! Los precios dependen del tipo de equipo y servicio. Aquí te va un resumen:\n\n**Aires de Ventana:**\n- Mantenimiento: $25\n- Diagnóstico: $15\n- Recarga de gas: $50\n- Instalación: $40\n- Reparación (compresor): $60\n\n**Aires Split:**\n- Mantenimiento (12BTU): $35\n- Diagnóstico: $15\n- Recarga de gas: $50\n- Instalación: $70\n- Reparación (compresor): $60\n\n**Neveras:**\n- Recarga de gas: $50\n- Reparación de fugas: $30\n- Cambio de compresor: $60\n\n**Aires por Toneladas (3-5 TON):** requieren cotización personalizada.\n\n¿Qué tipo de equipo tienes y qué servicio necesitas? Así te doy el precio exacto. 😊	4080	262	2026-08-25 19:26:21.942	text	\N
1b4b3d55-ea3b-4127-9a92-fa63a87e08d7	fe733295-8751-4504-8dfa-996b85a53e53	user	Cuanto demora el servicio?	\N	\N	2026-08-25 19:27:56.807	text	\N
6fcb931e-6e12-480b-a9cd-ee58e8195664	7881d0d0-b1c4-45c0-8393-ebeb8056c4f8	user	Hola	\N	\N	2026-08-23 04:33:53.457	text	\N
618f5a63-0da0-4648-8512-2ec877c085aa	fe733295-8751-4504-8dfa-996b85a53e53	assistant	¡Buena pregunta! Los tiempos varían según el servicio:\n\n- **Mantenimiento:** 1 a 2 horas\n- **Diagnóstico:** 30 a 45 minutos\n- **Recarga de gas:** 1 hora aprox.\n- **Instalación:** 2 a 4 horas\n- **Reparación de compresor:** puede tomar más tiempo según el equipo\n\n¿Qué servicio necesitas? Así te confirmo mejor el tiempo y coordinamos. 😊	1771	101	2026-08-25 19:27:58.551	text	\N
e2ae6747-647a-43d2-bc86-a56830341fd9	7881d0d0-b1c4-45c0-8393-ebeb8056c4f8	assistant	¡Hola! Bienvenido a Fresh Service Digital. ¿En qué puedo ayudarte con tu aire acondicionado o nevera?	1476	30	2026-08-23 04:33:54.382	text	\N
5b2178e3-3fba-4f02-97a9-55693e283885	7881d0d0-b1c4-45c0-8393-ebeb8056c4f8	user	Quiero que veas mi aire en foto	\N	\N	2026-08-23 04:34:25.245	text	\N
67f76853-c119-4d97-89f7-4ab9b6abf807	7881d0d0-b1c4-45c0-8393-ebeb8056c4f8	user	[Imagen]	\N	\N	2026-08-23 04:34:49.886	image	https://api.pedroservicios.xyz/uploads/chat-images/7881d0d0-b1c4-45c0-8393-ebeb8056c4f8-1787459689880.jpg
fedeeaee-f76a-42c8-8f1c-45e5803042f7	7881d0d0-b1c4-45c0-8393-ebeb8056c4f8	user	[Imagen]	\N	\N	2026-08-23 04:35:05.87	image	https://api.pedroservicios.xyz/uploads/chat-images/7881d0d0-b1c4-45c0-8393-ebeb8056c4f8-1787459705867.jpg
22292825-0fb9-4f41-9a28-b5de96d659a0	da650529-8067-44af-b7e6-a0f3a4e3bf11	user	Hey necesito precios económicos de aires acondicionado	\N	\N	2026-08-23 20:02:25.919	text	\N
84ef1b46-3af3-484a-beea-8c0f8dacb0ce	da650529-8067-44af-b7e6-a0f3a4e3bf11	tool	consultar_servicios: {"ok":true,"texto":"• Mantenimiento Preventivo (Aire de Ventana): $25\\n• Reparación (Aire de Ventana): $60\\n• Instalación (Aire de Ventana): $40\\n• Recarga de Gas (Aire de Ventana): $50\\n• Diagnóstico (Aire de Ventana): $15"}	\N	\N	2026-08-23 20:02:27.057	text	\N
35ac1f19-a9a2-4741-80d2-af801bda77a5	da650529-8067-44af-b7e6-a0f3a4e3bf11	assistant	¡Claro! Para aires de ventana (los más económicos), estos son nuestros precios:\n\n- **Diagnóstico:** $15\n- **Mantenimiento preventivo:** $25\n- **Recarga de gas:** $50\n- **Instalación:** $40\n- **Reparación:** $60\n\n¿Qué necesitas exactamente? Si me dejas tu nombre y WhatsApp, el taller te contacta para coordinar la visita. 😊	3131	162	2026-08-23 20:02:28.462	text	\N
b9608284-3107-4265-825b-71b054fe3c6f	da650529-8067-44af-b7e6-a0f3a4e3bf11	user	Me gusta enseñó mi aire por aquí en una imagen	\N	\N	2026-08-23 20:03:03.235	text	\N
e09c5e59-405d-45a9-892d-bcff6def00d6	b302c536-04d9-439d-a73d-15d9c86743d4	user	Hola	\N	\N	2026-08-23 05:08:47.524	text	\N
13bc9727-8e53-455e-bc9d-69566eeb17c1	b302c536-04d9-439d-a73d-15d9c86743d4	assistant	¡Hola! 👋 Bienvenido a Fresh Service Digital. ¿En qué puedo ayudarte con tu aire acondicionado o nevera?	1476	32	2026-08-23 05:08:48.733	text	\N
de4d36f0-6c67-4771-8d72-ca071d5d33cc	b302c536-04d9-439d-a73d-15d9c86743d4	user	Quiero que veas mi aire	\N	\N	2026-08-23 05:09:08.572	text	\N
c7024ab5-1554-4487-a117-31354783a2e9	b302c536-04d9-439d-a73d-15d9c86743d4	operator	ok envie	\N	\N	2026-08-23 05:09:16.956	text	\N
90bdcc15-6aad-4c55-a29c-59fccc05fb31	b302c536-04d9-439d-a73d-15d9c86743d4	user	[Imagen]	\N	\N	2026-08-23 05:09:24.427	image	https://api.pedroservicios.xyz/uploads/chat-images/b302c536-04d9-439d-a73d-15d9c86743d4-1787461764423.jpg
a4216f61-31fa-4bb8-b845-e6f4a3da5603	b302c536-04d9-439d-a73d-15d9c86743d4	user	[Imagen]	\N	\N	2026-08-23 05:09:56.882	image	https://api.pedroservicios.xyz/uploads/chat-images/b302c536-04d9-439d-a73d-15d9c86743d4-1787461796875.jpg
6bff8c7d-4563-4e33-81b8-6cf5dc78050a	da650529-8067-44af-b7e6-a0f3a4e3bf11	user	[Imagen]	\N	\N	2026-08-23 20:03:13.301	image	https://api.pedroservicios.xyz/uploads/chat-images/da650529-8067-44af-b7e6-a0f3a4e3bf11-1787515393298.jpg
4f646f6c-8453-4e7b-b6fa-ecaaaf34b1d8	da650529-8067-44af-b7e6-a0f3a4e3bf11	operator	excelente aire ❄️🔧📸	\N	\N	2026-08-23 20:03:39.756	text	\N
f54f41e2-60cf-4c2e-88f8-4f3519f32360	da650529-8067-44af-b7e6-a0f3a4e3bf11	user	Viste mibñ aire acondicionado	\N	\N	2026-08-23 20:04:20.863	text	\N
8837b0a7-9228-4fb1-b443-b1ed4797da55	da650529-8067-44af-b7e6-a0f3a4e3bf11	assistant	¡Claro que sí! Veo que me compartiste una imagen de tu aire acondicionado. 👍\n\nPara poder ayudarte mejor, ¿me cuentas qué le pasa al equipo? ¿Tiene alguna falla, no enfría bien, o necesitas mantenimiento?\n\nSi me dejas tu nombre y WhatsApp, el taller te contacta para coordinar la visita del técnico. 😊	1617	85	2026-08-23 20:04:22.549	text	\N
1859e99f-6189-4ac8-8475-6b95d662f8a8	ab04903b-9e37-4532-88ce-35ae3346b46e	user	Saludos necesito un servicio	\N	\N	2026-08-24 23:53:30.115	text	\N
7764fa23-82e1-4da8-a455-93a79e602825	ab04903b-9e37-4532-88ce-35ae3346b46e	assistant	¡Saludos! Con gusto te ayudo. ¿Qué tipo de servicio necesitas? ¿Mantenimiento, reparación, instalación o recarga de gas?	1577	34	2026-08-24 23:53:31.464	text	\N
de1a2ec6-66bc-406e-9c23-90aa4d4942b5	ab04903b-9e37-4532-88ce-35ae3346b46e	user	Una recarga	\N	\N	2026-08-24 23:53:46.608	text	\N
86f65900-0eb7-4858-84c8-39ed5a62f05d	ab04903b-9e37-4532-88ce-35ae3346b46e	tool	consultar_servicios: {"ok":true,"texto":"• Mantenimiento Preventivo (Aire Split): $35\\n• Reparación (Aire Split): $60\\n• Instalación (Aire Split): $70\\n• Recarga de Gas (Aire Split): $50\\n• Diagnóstico (Aire Split): $15"}	\N	\N	2026-08-24 23:53:47.95	text	\N
5853bb36-e2ef-4c91-88bc-02ae6d947aa5	ab04903b-9e37-4532-88ce-35ae3346b46e	assistant	La recarga de gas para aire split tiene un costo de **$50** (al cambio del día según el BCV).\n\n¿De qué equipo se trata, un split o una nevera? Y para coordinar, ¿me dejas tu nombre y número de WhatsApp?	3387	126	2026-08-24 23:53:49.266	text	\N
35660836-642d-459d-91d0-f3c0c3f293ae	ab04903b-9e37-4532-88ce-35ae3346b46e	user	Una nevera	\N	\N	2026-08-24 23:54:06.496	text	\N
01399c4e-a3ae-4334-8960-a5f0b79e4e30	ab04903b-9e37-4532-88ce-35ae3346b46e	assistant	Perfecto. Para coordinar la recarga de tu nevera, ¿me dejas tu nombre y número de WhatsApp? Así el taller se comunica contigo para agendar la visita.	1681	39	2026-08-24 23:54:08.137	text	\N
7d42e653-4539-4f6f-ac55-9800e2e8487b	ab04903b-9e37-4532-88ce-35ae3346b46e	user	Gorgue Mafangulo	\N	\N	2026-08-24 23:54:26.783	text	\N
c4998e49-876e-4606-8fd1-428f6c91a88d	ab04903b-9e37-4532-88ce-35ae3346b46e	tool	consultar_servicios: {"ok":true,"texto":"• Mantenimiento Preventivo (Tonelada 3T): cotización personalizada\\n• Reparación (Tonelada 3T): cotización personalizada\\n• Instalación (Tonelada 3T): cotización personalizada\\n• Recarga de Gas (Tonelada 3T): cotización personalizada\\n• Diagnóstico (Tonelada 3T): cotización personalizada\\n• Mantenimiento Preventivo (Tonelada 4T): cotización personalizada\\n• Reparación (Tonelada 4T): cotización personalizada\\n• Instalación (Tonelada 4T): cotización personalizada\\n• Recarga de Gas (Tonelada 4T): cotización personalizada\\n• Diagnóstico (Tonelada 4T): cotización personalizada\\n• Mantenimiento Preventivo (Tonelada 5T): cotización personalizada\\n• Reparación (Tonelada 5T): cotización personalizada\\n• Instalación (Tonelada 5T): cotización personalizada\\n• Recarga de Gas (Tonelada 5T): cotización personalizada\\n• Diagnóstico (Tonelada 5T): cotización personalizada"}	\N	\N	2026-08-24 23:54:27.657	text	\N
9d5e5ab6-c84c-4e90-a3a0-44efee50c24a	ab04903b-9e37-4532-88ce-35ae3346b46e	assistant	Gracias, Gorgue. Solo me falta tu número de WhatsApp para que el taller te contacte y coordine la visita para la recarga de tu nevera. ¿Me lo puedes facilitar?	3795	94	2026-08-24 23:54:28.751	text	\N
5a13d498-f1af-4632-950a-c3eaafc6bce5	ab04903b-9e37-4532-88ce-35ae3346b46e	user	00000000	\N	\N	2026-08-24 23:54:41.948	text	\N
75306c7a-287c-48a3-ad16-b76eed9a84a9	1f1ae9ea-22c2-4e69-897c-21f2f0c51bf7	user	Necesito botarlo a la basura	\N	\N	2026-08-25 17:52:27.288	text	\N
\.


--
-- Data for Name: chat_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_settings (key, value, "updatedAt") FROM stdin;
chat_system_prompt	{"text": "configurado en código"}	2026-08-21 19:56:43.587
chat_disabled_message	{"text": "Ahora mismo no puedo atenderte por aquí. Escríbenos por WhatsApp: +58 416-376-6075"}	2026-08-21 19:56:43.587
\.


--
-- Data for Name: equipment_type_options; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment_type_options (id, slug, label, "sortOrder", "isActive", "createdAt", description, "imageFilename") FROM stdin;
e2b20001-0000-4000-8000-000000000001	VENTANA	Aire de Ventana	2	t	2026-08-25 03:13:06.084	Unidades de ventana de todas las marcas	e2b20001-0000-4000-8000-000000000001-seed.jpg
e2b20001-0000-4000-8000-000000000002	SPLIT	Aire Split	3	t	2026-08-25 03:13:06.084	Sistemas mini y maxi split, interior y exterior	e2b20001-0000-4000-8000-000000000002-seed.jpg
6a2d5c5f-91f8-4b32-9f89-298139791234	NEVERA	Nevera	1	t	2026-08-25 01:23:37.987	Reparaciones y diagnosticos a domicilio	6a2d5c5f-91f8-4b32-9f89-298139791234-1787689531737.jpg
e2b20001-0000-4000-8000-000000000005	TONELADA_3	Aire de Toneladas	4	f	2026-08-25 03:13:06.084	Equipos de 3 a 5 toneladas para comercios y locales	e2b20001-0000-4000-8000-000000000005-seed.jpg
\.


--
-- Data for Name: equipments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipments (id, "appointmentId", brand, model, "serialNumber", "btuCapacity", "failureDescription") FROM stdin;
08344f77-f756-4925-abb8-310b07006398	31162192-d917-415e-a61e-15972411054d	Aire 3 Toneladas	Reparación	\N	36000	Se daño
22f04c6b-2932-4cc7-b832-40643b69bf60	9d8c1369-bda2-49ae-a7a0-c6d2276a6bf2	Aire de Ventana	Mantenimiento Preventivo	\N	12000	se revento toda esa mierda
22b9795c-d3ab-4f1f-aff3-ce1a754fdc8a	7bbfb85c-6b10-44df-82cb-01299ca9fc2c	Aire de Ventana	Recarga de Gas	\N	12000	Se está congelando una de las mangueras y bota agua la unidad. 
b60c90e6-ee1b-412c-ab3c-8558204be280	034f74b4-9004-467b-b928-f43a2c21ef33	Nevera	NEVERA	\N	0	Reparar una fuga\nDirección: La morera
ce1239a7-9086-4cf3-8559-9737feff164f	54fe2bc0-f70c-412f-8895-f2e973d491fc	Mabe	MMI12CDBWCA	SN-499943	12000	Instalación nueva de equipo split
f55693aa-b3a1-49e7-b446-29f2b2edb1cb	3296c407-5f55-44a9-9b6d-7b3fd93fb458	Carrier	XPower	SN-438097	24000	El control remoto no responde, no enciende
47c34a42-3104-494f-a917-feb7b9c91638	96e4bed8-5548-4af9-94db-e0911a71dcf6	Samsung	WindFree	SN-338648	18000	Bota agua dentro de la habitación, drenaje tapado
59e6ed6c-c39f-422e-b872-0f8bac87b4db	6ee30703-99ee-4a20-931c-c81a869311f5	Samsung	WindFree	SN-106812	18000	Hace ruido fuerte al encender, revisar compresor
c93923fc-aef0-4650-9af3-06e044dccd83	fa458213-3d33-4399-8021-42c002d58c2f	Aire de Ventana	Reparación	\N	12000	No tengo 
b9f149eb-5419-448b-9c65-bef9ad3d5d75	8a3f2ac5-c3ed-4191-9766-2ae53a9cafb8	Aire de Ventana	Reparación	\N	12000	Sin descripción adicional
17c90a47-e12e-4f8a-88d3-7cbbd75ea4d9	0af37668-9044-4f62-b988-39080b4d45be	Aire de Ventana	Mantenimiento Preventivo	\N	12000	Sin descripción adicional
006a63a1-8351-4fea-8be6-dc0d025124fb	d8d2adf4-e44a-4de6-9798-9b3a5a037c54	Aire de Ventana	Reparación	\N	12000	problema con el ventilador 
d10c11e5-86ec-43e1-b532-5d316947ded0	b5d29003-0e98-470b-b66e-a3c1fe079211	Aire de Ventana	Mantenimiento Preventivo	\N	12000	Está muy sucio y no sopla bien 
a19c9614-0417-4c49-9e6c-65ec718712a4	768bfd09-c257-4152-953f-f6f5e0f8d3c1	Aire de Ventana	Mantenimiento Preventivo	\N	12000	Tengo un aire de mamao cuánto sale reparalo
\.


--
-- Data for Name: service_category_options; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_category_options (id, slug, label, "sortOrder", "isActive", "createdAt") FROM stdin;
c1a10001-0000-4000-8000-000000000001	MANTENIMIENTO	Mantenimiento	1	t	2026-08-25 03:13:06.084
c1a10001-0000-4000-8000-000000000004	DIAGNOSTICO	Diagnóstico	5	t	2026-08-25 03:13:06.084
c1a10001-0000-4000-8000-000000000003	INSTALACION	Instalación	4	t	2026-08-25 03:13:06.084
c1a10001-0000-4000-8000-000000000002	REPARACION	Reparación	3	t	2026-08-25 03:13:06.084
c1a10001-0000-4000-8000-000000000005	RECARGA	Recarga	2	t	2026-08-25 03:13:06.084
12e0e7de-3db4-4020-8c6c-3fcc69cfcaab	FUGAS_BASICAS	Fugas Basicas	6	t	2026-08-25 20:35:52.897
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, name, category, "equipmentType", "priceUsd", description, "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
a1b2c3d4-e5f6-4a10-8b01-000000000015	Mantenimiento Preventivo	MANTENIMIENTO	TONELADA_3	100	Limpieza y revisión preventiva del equipo	t	50	2026-08-17 20:44:11.601	2026-08-17 20:44:11.601
a1b2c3d4-e5f6-4a10-8b01-000000000016	Reparación	REPARACION	TONELADA_3	150	Diagnóstico y reparación del equipo	t	51	2026-08-17 20:44:11.601	2026-08-17 20:44:11.601
a1b2c3d4-e5f6-4a10-8b01-000000000017	Instalación	INSTALACION	TONELADA_3	170	Instalación profesional del equipo	t	52	2026-08-17 20:44:11.601	2026-08-17 20:44:11.601
a1b2c3d4-e5f6-4a10-8b01-000000000018	Recarga de Gas	RECARGA	TONELADA_3	105	Recarga de gas refrigerante	t	53	2026-08-17 20:44:11.601	2026-08-17 20:44:11.601
a1b2c3d4-e5f6-4a10-8b01-000000000019	Diagnóstico	DIAGNOSTICO	TONELADA_3	55	Evaluación técnica del equipo	t	54	2026-08-17 20:44:11.601	2026-08-17 20:44:11.601
a1b2c3d4-e5f6-4a10-8b01-000000000008	Instalación	INSTALACION	SPLIT	70	Instalación solo del equipo no incluye trabajos electricos	t	22	2026-08-17 20:44:11.601	2026-08-21 16:01:45.949
a1b2c3d4-e5f6-4a10-8b01-000000000009	Recarga de Gas	RECARGA	SPLIT	50	Recarga de gas hasta 1 kilo	t	23	2026-08-17 20:44:11.601	2026-08-21 16:02:50.473
a1b2c3d4-e5f6-4a10-8b01-000000000007	Reparación	REPARACION	SPLIT	60	Instalación compresor nuevo	t	21	2026-08-17 20:44:11.601	2026-08-21 16:03:11.743
a1b2c3d4-e5f6-4a10-8b01-00000000000a	Diagnóstico	DIAGNOSTICO	SPLIT	15	Evaluación técnica a domicilio	t	24	2026-08-17 20:44:11.601	2026-08-21 16:05:21.233
a1b2c3d4-e5f6-4a10-8b01-000000000006	Mantenimiento Preventivo	MANTENIMIENTO	SPLIT	35	Limpieza, revisión preventiva del equipo aplica solo 12BTUs	t	20	2026-08-17 20:44:11.601	2026-08-21 16:06:09.231
a1b2c3d4-e5f6-4a10-8b01-000000000002	Reparación	REPARACION	VENTANA	60	Instalación compresor nuevo	t	11	2026-08-17 20:44:11.601	2026-08-21 16:08:07.627
a1b2c3d4-e5f6-4a10-8b01-000000000003	Instalación	INSTALACION	VENTANA	40	Instalación profesional del equipo	t	12	2026-08-17 20:44:11.601	2026-08-21 16:08:22.527
a1b2c3d4-e5f6-4a10-8b01-000000000004	Recarga de Gas	RECARGA	VENTANA	50	Recarga de gas hasta 1 kilo	t	13	2026-08-17 20:44:11.601	2026-08-21 16:08:52.005
a1b2c3d4-e5f6-4a10-8b01-000000000005	Diagnóstico	DIAGNOSTICO	VENTANA	15	Evaluación técnica a domicilio	t	14	2026-08-17 20:44:11.601	2026-08-21 16:09:06.649
a1b2c3d4-e5f6-4a10-8b01-000000000001	Mantenimiento Preventivo	MANTENIMIENTO	VENTANA	25	Limpieza, cambio de componentes básicos	t	10	2026-08-17 20:44:11.601	2026-08-21 16:10:19.606
ec121f1a-c768-4d52-a580-bd9bf8211cd9	Fugas Basicas	FUGAS_BASICAS	NEVERA	30	No incluye el gas	t	0	2026-08-25 01:43:41.358	2026-08-25 20:37:17.201
e29427e0-fbc8-45ba-bc55-7c008d28fd42	Recargas de gas	RECARGA	NEVERA	50	Hasta 1 kilo de gas	t	0	2026-08-25 01:24:50.435	2026-08-25 20:37:51.168
92e308be-0f37-4ef2-bf66-b8d3661b2895	Reemplazo de compresor	INSTALACION	NEVERA	60	Compresor nuevo	t	0	2026-08-25 01:42:12.669	2026-08-25 20:39:24.133
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (key, value, "updatedAt") FROM stdin;
bcv_rate	{"rate":785.0693,"date":"2026-08-25","source":"BCV"}	2026-08-25 21:00:36.479
\.


--
-- Data for Name: site_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_images (id, slot, filename, "mimeType", width, height, "sizeBytes", "updatedAt") FROM stdin;
b7bbe67f-1c64-4489-9d60-d055e5070039	technician	technician-1787272031049.jpg	image/jpeg	1200	896	862107	2026-08-21 00:27:11.07
1f617fc1-51f7-4d8c-871a-be8265a334cc	service_toneladas	service_toneladas-1787272140519.jpg	image/jpeg	1200	896	849318	2026-08-21 00:29:00.534
7731cf34-8538-4ee7-8248-62fc42a9bcb6	service_ventana	service_ventana-1787272160543.jpg	image/jpeg	1200	896	780431	2026-08-21 00:29:20.556
f4771a7e-822a-4751-93be-325a82581fc2	service_split	service_split-1787323485038.jpg	image/jpeg	1200	896	665254	2026-08-21 14:44:45.052
a3ead915-cb66-4e08-923a-aa885e142835	hero	hero-1787690447622.jpg	image/jpeg	1200	896	800492	2026-08-25 20:40:47.641
\.


--
-- Data for Name: ticker_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticker_messages (id, text, "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmt848jql0000kyfebqblz4qb	🔥 Nos volvimos locos con los precios en agosto, aprovecha la promo del 20% de descuento ❄️	t	0	2026-08-25 03:39:04.555	2026-08-25 03:39:04.555
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, "firstName", "lastName", phone, role, "createdAt", "updatedAt", "isVerified", "verificationCode", cedula, "resetToken", "resetTokenExpiry", "isActive", specialty, username) FROM stdin;
09009e1c-55a6-4909-acf6-34c4b8d139a8	pedroventas86@gmail.com	$2b$10$placeholder_not_usable_for_login	Pablo	test	+584129877766	CLIENT	2026-08-25 05:02:51.796	2026-08-25 05:02:51.796	f	\N	\N	\N	\N	t	\N	\N
b554b392-2041-4484-893d-4a69bf748d3b	ana.martinez@outlook.com	$2b$10$0jZUkGR7FHaJ/ctWvxy6zeI4VKlhCZFHjGj6q8JE/eBV0N6T6TsUm	Ana	Martínez	+584242890629	CLIENT	2026-05-16 08:00:00	2026-06-23 22:18:48.373	t	\N	\N	\N	\N	t	\N	\N
590a5d96-59d4-49e1-a40a-21cacda48438	yolanda.torres@gmail.com	$2b$10$0jZUkGR7FHaJ/ctWvxy6zeI4VKlhCZFHjGj6q8JE/eBV0N6T6TsUm	Yolanda	Torres	+584266532741	CLIENT	2026-03-22 12:30:00	2026-06-23 22:18:48.504	t	\N	\N	\N	\N	t	\N	\N
68fcb84b-9298-4fb6-8f53-1d872097f56f	popp.1914@gmail.com	$2b$10$TtHuhOhm89IkzQjLBxRMKO93S5MF1rWEe3W3biwK1rMSTi8ahom6O	Luis	Marcano	+584243290664	CLIENT	2026-08-15 19:25:55.964	2026-08-21 01:46:22.926	t	\N	V-24565522	\N	\N	t	\N	\N
71bc3e9d-fd01-4a2d-bb35-54b89f3a30c4	admin@freshservice.com	$2b$10$fTEsesZyQZExZz2rQJkoGO2Dz7eiXJyVlpbWJVLGIMROJMP51v5d6	Admin	Taller	+584140000000	ADMIN	2026-06-23 22:18:48.191	2026-06-23 22:18:48.191	t	\N	V-17062670	\N	\N	t	\N	admin
47c5f2c0-3507-432c-b219-382cb5913bb6	juan.tecnico@freshservice.com	$2b$10$ROUgEFaItmhckMT9UOW9IuHbOYoG.CHj7fX8j5zFSYBnwoRUd51ZW	Juan	Aires de Ventana	+58 412-111 2233	TECHNICIAN	2026-07-18 05:59:15.269	2026-08-22 20:14:40.448	t	\N	\N	\N	\N	t	Aires de Ventana	juan_tecnico
aaa055ca-af98-4687-9f18-299dcb5ab973	m3ntecreativa@gmail.com	$2b$10$950.5ctc8x5rZ/degu2uk.AOAJ/DTIVA1XOL2k4YpQm3sc./mmlge	Luis	Gonzalez	+584127788493	CLIENT	2026-08-15 21:01:45.006	2026-08-15 21:08:07.627	t	\N	V-21336646	\N	\N	t	\N	\N
284ae89b-d217-4487-97ac-c8c45d30dc0c	josefranciscoflores88@gmail.com	$2b$10$OI3RM9VWl.7P5M1jk5fKi.72VFRJbuXt0AVntnkvZUATnMRwvZ9rm	Jose	Flores	+584245747820	CLIENT	2026-08-16 00:03:49.135	2026-08-16 00:04:42.183	t	\N	\N	\N	\N	t	\N	\N
fa88df8e-27f3-4347-875e-0b8dafb49947	carlos.tecnico@freshservice.com	$2b$10$ROUgEFaItmhckMT9UOW9IuHbOYoG.CHj7fX8j5zFSYBnwoRUd51ZW	Carlos	Aires Split	+58 414-222 3344	TECHNICIAN	2026-07-18 05:59:15.307	2026-08-22 20:15:12.348	t	\N	\N	\N	\N	t	Aires Split	carlos_tecnico
84632d9a-7384-4f3b-9b23-ee5eb7864ce5	textualiti@gmail.com	$2b$10$JIhEbabp9SLg7YBE70Um.O0Z/tQK/Q.cFihlQJPsERfy/FVWW7xMG	William	Bastidas	+584122633831	CLIENT	2026-08-17 23:26:18.616	2026-08-17 23:50:36.842	t	\N	V-15712097	\N	\N	t	\N	\N
5db6ed86-1079-4f83-9e0a-d07ed4771c5f	joselizzkairos@gmail.com	$2b$10$jDCXD2LA.y68qTYNi.0GGe00F5EM.DIz7rcNyHoHYSlgVu9tfI.qe	Josi	Ron	+584241551081	CLIENT	2026-08-15 18:56:59.988	2026-08-15 18:59:17.558	t	\N	V-16363973	\N	\N	t	\N	\N
7a8b0aef-d5ae-4377-8a20-e34a9b6fa0f5	rafeael@gmail.com	$2b$10$2s0WvL3MnJqdtS9Ovkc/Y.wvyIoG/ddAH.2pCjjOTcf4OBjKXKgB2	Rafael 	Godoy	+584144542057	TECHNICIAN	2026-08-22 20:27:49.047	2026-08-22 20:27:49.047	t	\N	\N	\N	\N	t	General	rafael_tecnico
a7dbe934-8fc1-45da-a98a-742972d50d8a	temistoclesledezma@gmail.com	$2b$10$JW9cIfEdLOsKchrK47wVI.r5cU1bh2zFKLpdFjD8XOaHrVXvBDGj6	José	Ledezma	+584142737152	CLIENT	2026-08-17 19:26:18.47	2026-08-17 19:29:29.697	t	\N	V-17352958	\N	\N	t	\N	\N
ee770cb3-5e6e-4710-aaa2-74b7fe4bbd13	boettm.angell@gmail.com	$2b$10$Gyp6ZhW3LNcQEhpf6QM9vOl.pe/JMAElu74liMSFO44PVWtcGE4Gu	Angel	Boett	+584243690817	CLIENT	2026-08-17 19:29:25.633	2026-08-17 19:30:26.899	t	\N	\N	\N	\N	t	\N	\N
ea331c9b-6416-4765-8ceb-bdd9e7ad760f	asesorpedrocabeza7254@gmail.com	$2b$10$1p5RhQNHsZ/SyhvLcbCPdu/Cq1boBOUyVmYbCu0Flzo8MVheHHsee	Saul	ELduro	4241585328	TECHNICIAN	2026-08-15 21:03:37.053	2026-08-24 01:48:57.77	t	\N	\N	\N	\N	t	General	saul_tecnico
5f3a5249-6eeb-4fcb-b3f3-8d0f9021d3d4	stevecarrasco69@gmail.com	$2b$10$Za6gWXoxR/tgb.sxrS228OI7YFF7KRmNS6GaNXhD4Rvu55HPWQQUO	Mike	Blaz	+584128987654	CLIENT	2026-08-17 19:39:22.357	2026-08-17 19:43:16.112	t	\N	V-16364428	\N	\N	t	\N	\N
8c9364eb-eb3b-4e72-ab68-6d8923c058c1	micheladrian984@gmail.com	$2b$10$voPvrOmbbNWQuzit6fUV2.EQVIuRcme1AL40Jx40ezpMbY.k/M3Q.	Michel	Adrián	+584141462378	CLIENT	2026-08-18 03:20:43.324	2026-08-18 03:28:26.277	t	\N	V-17978764	\N	\N	t	\N	\N
bacb5da7-7959-4657-aec9-4043d62d0692	nicole.sofia.cabeza@gmail.com	$2b$10$UtdY5HUuHEyc/W0T5MmVZe6u7XLO.KuCNtdprnfK.sg4tlZZG143S	Nicole	Cabeza	+580416280896	CLIENT	2026-08-20 23:24:18.523	2026-08-20 23:25:58.911	t	\N	\N	\N	\N	t	\N	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: carousel_images carousel_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_images
    ADD CONSTRAINT carousel_images_pkey PRIMARY KEY (id);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_leads chat_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_leads
    ADD CONSTRAINT chat_leads_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_settings chat_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_settings
    ADD CONSTRAINT chat_settings_pkey PRIMARY KEY (key);


--
-- Name: equipment_type_options equipment_type_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_type_options
    ADD CONSTRAINT equipment_type_options_pkey PRIMARY KEY (id);


--
-- Name: equipments equipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT equipments_pkey PRIMARY KEY (id);


--
-- Name: service_category_options service_category_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_category_options
    ADD CONSTRAINT service_category_options_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: site_images site_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_images
    ADD CONSTRAINT site_images_pkey PRIMARY KEY (id);


--
-- Name: ticker_messages ticker_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticker_messages
    ADD CONSTRAINT ticker_messages_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: appointments_clientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "appointments_clientId_idx" ON public.appointments USING btree ("clientId");


--
-- Name: appointments_serviceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "appointments_serviceId_idx" ON public.appointments USING btree ("serviceId");


--
-- Name: appointments_technicianId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "appointments_technicianId_idx" ON public.appointments USING btree ("technicianId");


--
-- Name: chat_conversations_ipHash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "chat_conversations_ipHash_idx" ON public.chat_conversations USING btree ("ipHash");


--
-- Name: chat_conversations_sessionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "chat_conversations_sessionId_key" ON public.chat_conversations USING btree ("sessionId");


--
-- Name: chat_conversations_startedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "chat_conversations_startedAt_idx" ON public.chat_conversations USING btree ("startedAt");


--
-- Name: chat_leads_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "chat_leads_createdAt_idx" ON public.chat_leads USING btree ("createdAt");


--
-- Name: chat_messages_conversationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "chat_messages_conversationId_idx" ON public.chat_messages USING btree ("conversationId");


--
-- Name: equipment_type_options_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX equipment_type_options_slug_key ON public.equipment_type_options USING btree (slug);


--
-- Name: service_category_options_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX service_category_options_slug_key ON public.service_category_options USING btree (slug);


--
-- Name: services_name_equipmentType_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "services_name_equipmentType_key" ON public.services USING btree (name, "equipmentType");


--
-- Name: site_images_slot_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX site_images_slot_key ON public.site_images USING btree (slot);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: appointments appointments_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appointments appointments_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_technicianId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.chat_conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: equipments equipments_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT "equipments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict wRFmIUvCTh1IsQApKTSZGNdHCsTCsUBSghDOhrhwfr4YQDdd2qDYg82O6WllApa

