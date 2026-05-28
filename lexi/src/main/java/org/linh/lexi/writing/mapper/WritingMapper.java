package org.linh.lexi.writing.mapper;

import org.linh.lexi.writing.domain.WritingEntry;
import org.linh.lexi.writing.dto.WritingEntryDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface WritingMapper {

    @Mapping(target = "createdAt", source = "createdAt")
    WritingEntryDto toDto(WritingEntry entry);
}
